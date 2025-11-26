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
      
      const { titulo, descripcion, nombre_cliente, telefono, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, activo } = req.body;
      
      // Si es DJ (no admin), no puede cambiar el dj_responsable_id
      let djResponsableIdUpdate = dj_responsable_id ? parseInt(dj_responsable_id, 10) : undefined;
      if (auth.user.rol !== 'admin') {
        // Los DJs no pueden cambiar el responsable, siempre debe ser ellos
        djResponsableIdUpdate = undefined; // No permitir cambio
      }
      
      const coordinacion = await Coordinacion.update(parseInt(id, 10), {
        titulo,
        descripcion,
        nombre_cliente,
        telefono,
        tipo_evento,
        codigo_evento,
        fecha_evento,
        hora_evento,
        salon_id: salon_id ? parseInt(salon_id, 10) : undefined,
        dj_responsable_id: djResponsableIdUpdate,
        estado,
        prioridad,
        notas,
        activo,
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

