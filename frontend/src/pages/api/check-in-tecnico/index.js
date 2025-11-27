import { authenticateToken } from '@/lib/auth.js';
import { CheckInTecnico } from '@/lib/models/CheckInTecnico.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { dj_id, salon_id, estado_general, fecha_desde, fecha_hasta, limit, offset } = req.query;

      // Si es un DJ (no admin), solo puede ver sus propios check-ins
      const filters = {
        dj_id: auth.user.rol === 'admin' ? (dj_id || null) : auth.user.id,
        salon_id: salon_id || null,
        estado_general: estado_general || null,
        fecha_desde: fecha_desde || null,
        fecha_hasta: fecha_hasta || null,
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null,
      };

      const checkIns = await CheckInTecnico.findAll(filters);
      return res.json(checkIns);
    } catch (error) {
      console.error('Error al obtener check-ins técnicos:', error);
      return res.status(500).json({ error: 'Error al obtener check-ins técnicos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { salon_id, fecha, evento_id, equipos, observaciones, estado_general } = req.body;

      if (!salon_id) {
        return res.status(400).json({ error: 'El salón es requerido' });
      }

      if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
      }

      if (!equipos || !Array.isArray(equipos)) {
        return res.status(400).json({ error: 'Los equipos son requeridos y deben ser un array' });
      }

      // Validar que cada equipo tenga nombre y estado
      for (const equipo of equipos) {
        if (!equipo.nombre || !equipo.estado) {
          return res.status(400).json({ error: 'Cada equipo debe tener nombre y estado' });
        }
      }

      // Si es un DJ (no admin), el dj_id se asigna automáticamente
      const nuevoCheckIn = await CheckInTecnico.create({
        dj_id: auth.user.id,
        salon_id,
        fecha,
        evento_id: evento_id || null,
        equipos,
        observaciones: observaciones || null,
        estado_general: estado_general || 'ok',
      });

      return res.status(201).json(nuevoCheckIn);
    } catch (error) {
      console.error('Error al crear check-in técnico:', error);
      return res.status(500).json({ error: error.message || 'Error al crear check-in técnico' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

