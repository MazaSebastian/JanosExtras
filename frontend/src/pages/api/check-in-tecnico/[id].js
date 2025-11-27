import { authenticateToken } from '@/lib/auth.js';
import { CheckInTecnico } from '@/lib/models/CheckInTecnico.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const checkIn = await CheckInTecnico.findById(id);

      if (!checkIn) {
        return res.status(404).json({ error: 'Check-in técnico no encontrado' });
      }

      // Si es un DJ (no admin), solo puede ver sus propios check-ins
      if (auth.user.rol !== 'admin' && checkIn.dj_id !== auth.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver este check-in' });
      }

      return res.json(checkIn);
    } catch (error) {
      console.error('Error al obtener check-in técnico:', error);
      return res.status(500).json({ error: 'Error al obtener check-in técnico' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const checkIn = await CheckInTecnico.findById(id);

      if (!checkIn) {
        return res.status(404).json({ error: 'Check-in técnico no encontrado' });
      }

      // Si es un DJ (no admin), solo puede actualizar sus propios check-ins
      if (auth.user.rol !== 'admin' && checkIn.dj_id !== auth.user.id) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar este check-in' });
      }

      const { equipos, observaciones, estado_general } = req.body;

      const updates = {};
      if (equipos !== undefined) {
        if (!Array.isArray(equipos)) {
          return res.status(400).json({ error: 'Los equipos deben ser un array' });
        }
        updates.equipos = equipos;
      }
      if (observaciones !== undefined) {
        updates.observaciones = observaciones;
      }
      if (estado_general !== undefined) {
        updates.estado_general = estado_general;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      const checkInActualizado = await CheckInTecnico.update(id, updates);
      return res.json(checkInActualizado);
    } catch (error) {
      console.error('Error al actualizar check-in técnico:', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar check-in técnico' });
    }
  }

  if (req.method === 'DELETE') {
    // Solo admins pueden eliminar check-ins
    if (auth.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar check-ins' });
    }

    try {
      const checkIn = await CheckInTecnico.delete(id);

      if (!checkIn) {
        return res.status(404).json({ error: 'Check-in técnico no encontrado' });
      }

      return res.json({ message: 'Check-in técnico eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar check-in técnico:', error);
      return res.status(500).json({ error: 'Error al eliminar check-in técnico' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

