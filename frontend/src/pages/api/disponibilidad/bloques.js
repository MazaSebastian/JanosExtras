import { authenticateToken } from '@/lib/auth.js';
import DisponibilidadBloque from '@/lib/models/DisponibilidadBloque.js';
import { DJ } from '@/lib/models/DJ.js';
import pool from '@/lib/database-config.js';

export default async function handler(req, res) {
  // Manejar GET: obtener bloques de una fecha
  if (req.method === 'GET') {
    try {
      let djId = null;
      const { fecha, dj_id, salon_id, pre_token } = req.query;

      if (!fecha) {
        return res.status(400).json({ error: 'El parámetro fecha (YYYY-MM-DD) es requerido' });
      }

      // Si viene con pre_token de un cliente público
      if (pre_token) {
        const coordRes = await pool.query(
          'SELECT dj_responsable_id, salon_id FROM coordinaciones WHERE pre_coordinacion_token = $1 AND activo = true',
          [pre_token]
        );
        if (coordRes.rows.length > 0) {
          djId = coordRes.rows[0].dj_responsable_id;
        }
      } else {
        // Validación de autenticación estándar para panel DJ
        const auth = authenticateToken(req);
        if (auth.error) {
          return res.status(auth.status).json({ error: auth.error });
        }
        djId = dj_id ? parseInt(dj_id) : auth.user.id;
      }

      const bloques = await DisponibilidadBloque.findByDjAndDate(
        djId,
        fecha,
        salon_id ? parseInt(salon_id) : null
      );

      return res.status(200).json({
        success: true,
        fecha,
        dj_id: djId,
        bloques: bloques || []
      });
    } catch (err) {
      console.error('Error al obtener bloques de disponibilidad:', err);
      return res.status(500).json({ error: 'Error interno al consultar bloques de disponibilidad' });
    }
  }

  // A partir de aquí los métodos requieren autenticación
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const currentDjId = auth.user.id;

  // POST: Crear bloques (individual, lote o importar habituales)
  if (req.method === 'POST') {
    try {
      const { fecha, hora_inicio, hora_fin, salon_id, bloques, action } = req.body;

      if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
      }

      const fechaStr = fecha.split('T')[0];

      // Acción 1: Importar horarios habituales configurados en el perfil del DJ
      if (action === 'importar_habituales') {
        const dj = await DJ.findById(currentDjId);
        if (!dj || !dj.disponibilidad_videollamada) {
          return res.status(400).json({ error: 'No tienes configurada tu disponibilidad habitual en Ajustes' });
        }

        const disp = typeof dj.disponibilidad_videollamada === 'string'
          ? JSON.parse(dj.disponibilidad_videollamada)
          : dj.disponibilidad_videollamada;

        const horasPorDia = disp?.horasDisponibles || {};
        
        // Determinar qué día de la semana es (0=domingo, 1=lunes...)
        const [y, m, d] = fechaStr.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d);
        const dayMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const dayKey = dayMap[targetDate.getDay()];

        const slots = horasPorDia[dayKey] || [];
        if (slots.length === 0) {
          return res.status(200).json({
            success: true,
            message: `No tienes horarios habituales configurados para el día ${dayKey}`,
            bloques: []
          });
        }

        // Obtener bloques ya existentes en esa fecha para no duplicar
        const existentes = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
        const horasExistentes = new Set(existentes.map(b => b.hora_inicio));

        const creados = [];
        for (const slot of slots) {
          if (!horasExistentes.has(slot)) {
            const nuevo = await DisponibilidadBloque.create({
              dj_id: currentDjId,
              salon_id: salon_id ? parseInt(salon_id) : null,
              fecha: fechaStr,
              hora_inicio: slot,
              hora_fin: null,
              estado: 'disponible'
            });
            creados.push(nuevo);
          }
        }

        const todos = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
        return res.status(201).json({
          success: true,
          creados: creados.length,
          bloques: todos
        });
      }

      // Acción 2: Crear lista de horas en bulk (ej: ['14:00', '15:00', '16:00'])
      if (Array.isArray(bloques) && bloques.length > 0) {
        const existentes = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
        const horasExistentes = new Set(existentes.map(b => b.hora_inicio));

        const creados = [];
        for (const item of bloques) {
          const hora = typeof item === 'string' ? item : item.hora_inicio;
          const fin = typeof item === 'object' ? item.hora_fin : null;
          if (hora && !horasExistentes.has(hora)) {
            const nuevo = await DisponibilidadBloque.create({
              dj_id: currentDjId,
              salon_id: salon_id ? parseInt(salon_id) : null,
              fecha: fechaStr,
              hora_inicio: hora,
              hora_fin: fin,
              estado: 'disponible'
            });
            creados.push(nuevo);
            horasExistentes.add(hora);
          }
        }

        const todos = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
        return res.status(201).json({
          success: true,
          creados: creados.length,
          bloques: todos
        });
      }

      // Acción 3: Crear bloque individual
      if (!hora_inicio) {
        return res.status(400).json({ error: 'hora_inicio es requerida' });
      }

      // Verificar si ya existe ese horario
      const existentes = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
      const existe = existentes.find(b => b.hora_inicio === hora_inicio);
      if (existe) {
        return res.status(400).json({ error: `El horario ${hora_inicio} ya existe para este día` });
      }

      const nuevo = await DisponibilidadBloque.create({
        dj_id: currentDjId,
        salon_id: salon_id ? parseInt(salon_id) : null,
        fecha: fechaStr,
        hora_inicio,
        hora_fin,
        estado: 'disponible'
      });

      const todos = await DisponibilidadBloque.findByDjAndDate(currentDjId, fechaStr);
      return res.status(201).json({
        success: true,
        bloque: nuevo,
        bloques: todos
      });
    } catch (err) {
      console.error('Error al crear bloque de disponibilidad:', err);
      return res.status(500).json({ error: 'Error al crear bloque de disponibilidad' });
    }
  }

  // DELETE: Eliminar bloque individual o todos los libres de un día
  if (req.method === 'DELETE') {
    try {
      const { id, fecha, clear_free } = req.query;

      if (id) {
        await DisponibilidadBloque.delete(parseInt(id));
        return res.status(200).json({ success: true, message: 'Bloque eliminado' });
      }

      if (fecha && clear_free === 'true') {
        const fechaStr = fecha.split('T')[0];
        await DisponibilidadBloque.deleteFreeByDjAndDate(currentDjId, fechaStr);
        return res.status(200).json({ success: true, message: 'Bloques libres eliminados' });
      }

      return res.status(400).json({ error: 'Se requiere id o fecha con clear_free=true' });
    } catch (err) {
      console.error('Error al eliminar bloque:', err);
      return res.status(500).json({ error: 'Error al eliminar bloque' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
