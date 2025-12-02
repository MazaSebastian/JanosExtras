import { authenticateToken } from '@/lib/auth.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const coordinacion = await Coordinacion.findById(parseInt(id, 10));
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }
      
      // Si es DJ (no admin), solo puede ver sus propias coordinaciones
      if (auth.user.rol !== 'admin' && coordinacion.dj_responsable_id !== auth.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta coordinación' });
      }
      
      return res.json(coordinacion);
    } catch (error) {
      console.error('Error al obtener coordinación:', error);
      return res.status(500).json({ error: 'Error al obtener coordinación' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Verificar permisos antes de actualizar
      const coordinacionExistente = await Coordinacion.findById(parseInt(id, 10));
      if (!coordinacionExistente) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }
      
      // Si es DJ (no admin), solo puede editar sus propias coordinaciones
      if (auth.user.rol !== 'admin' && coordinacionExistente.dj_responsable_id !== auth.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para editar esta coordinación' });
      }
      
      const { titulo, nombre_cliente, telefono, tipo_evento, codigo_evento, fecha_evento, dj_responsable_id, estado, notas } = req.body;
      
      // Si es DJ (no admin), no puede cambiar el dj_responsable_id
      let djResponsableIdUpdate = dj_responsable_id ? parseInt(dj_responsable_id, 10) : undefined;
      if (auth.user.rol !== 'admin') {
        // Los DJs no pueden cambiar el responsable, siempre debe ser ellos
        djResponsableIdUpdate = undefined; // No permitir cambio
      }
      
      // Normalizar fecha_evento para evitar problemas de zona horaria
      // IMPORTANTE: Los inputs type="date" envían "YYYY-MM-DD" que debemos usar directamente
      // NO crear objetos Date porque JavaScript los interpreta como UTC y puede restar un día
      let fechaEventoNormalizada = undefined; // Usar undefined para no actualizar si no se proporciona
      if (fecha_evento !== undefined) {
        if (fecha_evento === null) {
          fechaEventoNormalizada = null;
        } else if (typeof fecha_evento === 'string') {
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
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development' && fecha_evento !== undefined) {
        console.log('[Coordinaciones API Update] Normalización de fecha:', {
          original: fecha_evento,
          normalizada: fechaEventoNormalizada,
          tipo: typeof fecha_evento
        });
      }
      
      const coordinacion = await Coordinacion.update(parseInt(id, 10), {
        titulo,
        nombre_cliente,
        telefono,
        tipo_evento,
        codigo_evento,
        fecha_evento: fechaEventoNormalizada,
        dj_responsable_id: djResponsableIdUpdate,
        estado,
        notas,
      });

      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }

      return res.json(coordinacion);
    } catch (error) {
      console.error('Error al actualizar coordinación:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        body: req.body
      });
      return res.status(500).json({ 
        error: 'Error al actualizar coordinación',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Verificar permisos antes de eliminar
      const coordinacion = await Coordinacion.findById(parseInt(id, 10));
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }
      
      // Si es DJ (no admin), solo puede eliminar sus propias coordinaciones
      if (auth.user.rol !== 'admin' && coordinacion.dj_responsable_id !== auth.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta coordinación' });
      }
      
      const resultado = await Coordinacion.delete(parseInt(id, 10));
      if (!resultado) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }
      return res.json({ message: 'Coordinación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar coordinación:', error);
      return res.status(500).json({ error: 'Error al eliminar coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

