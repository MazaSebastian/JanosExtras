import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';
import { Salon } from '@/lib/models/Salon.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'POST') {
    try {
      const { salon_id, fecha_evento } = req.body;
      const dj_id = auth.user.id;

      if (!salon_id || !fecha_evento) {
        return res.status(400).json({ error: 'Salón y fecha son requeridos' });
      }

      // Verificar que el salón existe
      const salon = await Salon.findById(salon_id);
      if (!salon) {
        return res.status(404).json({ error: 'Salón no encontrado' });
      }

      // Validar formato de fecha
      const fecha = new Date(fecha_evento);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({ error: 'Fecha inválida' });
      }

      const event = await Event.create({ dj_id, salon_id, fecha_evento: fecha });
      res.status(201).json(event);
    } catch (error) {
      if (error.message === 'Ya existe un evento registrado para esta fecha y salón') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Error al crear evento:', error);
      res.status(500).json({ error: 'Error al crear evento' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}

