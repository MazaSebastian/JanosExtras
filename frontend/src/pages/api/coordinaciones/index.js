import { authenticateToken } from '@/lib/auth.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, estado, dj_responsable_id, salon_id } = req.query;
      
      // Si es DJ (no admin), filtrar automáticamente por su ID
      // Los admins pueden ver todas o filtrar manualmente
      let djFilterId = dj_responsable_id ? parseInt(dj_responsable_id, 10) : null;
      if (auth.user.rol !== 'admin' && !djFilterId) {
        djFilterId = auth.user.id;
      }
      
      const coordinaciones = await Coordinacion.findAll({
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        estado: estado || null,
        dj_responsable_id: djFilterId,
        salon_id: salon_id ? parseInt(salon_id, 10) : null,
      });
      return res.json(coordinaciones);
    } catch (error) {
      console.error('Error al obtener coordinaciones:', error);
      return res.status(500).json({ error: 'Error al obtener coordinaciones' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas } = req.body;

      // Generar título automáticamente si no se proporciona
      const tituloFinal = titulo || (nombre_cliente ? `${nombre_cliente} - ${tipo_evento || 'Evento'}` : 'Nueva Coordinación');

      // Asignar automáticamente el DJ responsable:
      // - Si es admin, puede especificar otro DJ o usar el suyo
      // - Si es DJ, siempre se asigna a sí mismo
      let djResponsableId = dj_responsable_id ? parseInt(dj_responsable_id, 10) : null;
      if (auth.user.rol !== 'admin') {
        djResponsableId = auth.user.id; // DJs siempre crean coordinaciones para sí mismos
      } else if (!djResponsableId) {
        djResponsableId = auth.user.id; // Si admin no especifica, usar el suyo
      }

      // Normalizar fecha_evento para evitar problemas de zona horaria
      // IMPORTANTE: Los inputs type="date" envían "YYYY-MM-DD" que debemos usar directamente
      // NO crear objetos Date porque JavaScript los interpreta como UTC y puede restar un día
      let fechaEventoNormalizada = null;
      if (fecha_evento) {
        // Si es string y ya está en formato YYYY-MM-DD, usar directamente
        if (typeof fecha_evento === 'string') {
          // Limpiar espacios y verificar formato
          const fechaLimpia = fecha_evento.trim();
          if (fechaLimpia.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Ya está en formato correcto, usar directamente (evita problemas de zona horaria)
            fechaEventoNormalizada = fechaLimpia;
          } else if (fechaLimpia.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            // Formato DD/MM/YYYY - convertir a YYYY-MM-DD
            const [day, month, year] = fechaLimpia.split('/');
            fechaEventoNormalizada = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            // Intentar parsear como Date pero usar métodos locales para evitar UTC
            const fecha = new Date(fechaLimpia);
            if (!isNaN(fecha.getTime())) {
              // Usar métodos locales (no UTC) para evitar problemas de zona horaria
              const year = fecha.getFullYear();
              const month = String(fecha.getMonth() + 1).padStart(2, '0');
              const day = String(fecha.getDate()).padStart(2, '0');
              fechaEventoNormalizada = `${year}-${month}-${day}`;
            }
          }
        } else if (fecha_evento instanceof Date) {
          // Si ya es un objeto Date, usar métodos locales
          const year = fecha_evento.getFullYear();
          const month = String(fecha_evento.getMonth() + 1).padStart(2, '0');
          const day = String(fecha_evento.getDate()).padStart(2, '0');
          fechaEventoNormalizada = `${year}-${month}-${day}`;
        }
      }
      
      // Log para debugging (siempre activo para diagnosticar)
      console.log('[Coordinaciones API] Normalización de fecha:', {
        original: fecha_evento,
        normalizada: fechaEventoNormalizada,
        tipo: typeof fecha_evento,
        timestamp: new Date().toISOString()
      });

      const coordinacion = await Coordinacion.create({
        titulo: tituloFinal,
        descripcion: descripcion || null,
        nombre_cliente: nombre_cliente || null,
        tipo_evento: tipo_evento || null,
        codigo_evento: codigo_evento || null,
        fecha_evento: fechaEventoNormalizada,
        hora_evento: hora_evento || null,
        salon_id: salon_id ? parseInt(salon_id, 10) : null,
        dj_responsable_id: djResponsableId,
        estado: estado || 'pendiente',
        prioridad: prioridad || 'normal',
        notas: notas || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json(coordinacion);
    } catch (error) {
      console.error('Error al crear coordinación:', error);
      return res.status(500).json({ error: 'Error al crear coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

