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
      return res.json(coordinacion);
    } catch (error) {
      console.error('Error al obtener coordinación:', error);
      return res.status(500).json({ error: 'Error al obtener coordinación' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, activo } = req.body;
      const coordinacion = await Coordinacion.update(parseInt(id, 10), {
        titulo,
        descripcion,
        nombre_cliente,
        tipo_evento,
        codigo_evento,
        fecha_evento,
        hora_evento,
        salon_id: salon_id ? parseInt(salon_id, 10) : undefined,
        dj_responsable_id: dj_responsable_id ? parseInt(dj_responsable_id, 10) : undefined,
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
      return res.status(500).json({ error: 'Error al actualizar coordinación' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const coordinacion = await Coordinacion.delete(parseInt(id, 10));
      if (!coordinacion) {
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

