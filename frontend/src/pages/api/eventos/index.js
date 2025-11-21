import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';
import { Salon } from '@/lib/models/Salon.js';
import { createEventSchema } from '@/utils/validation.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'POST') {
    try {
      const parsed = createEventSchema.safeParse({
        salon_id: req.body.salon_id ? parseInt(req.body.salon_id, 10) : undefined,
        fecha_evento: req.body.fecha_evento,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const { salon_id, fecha_evento } = parsed.data;
      const dj_id = auth.user.id;

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
      if (error.message === 'Ya has registrado un evento para esta fecha y salón' || 
          error.message === 'Esta fecha ya está ocupada por otro DJ') {
        return res.status(409).json({ error: error.message });
      }
      Sentry.captureException(error);
      console.error('Error al crear evento:', error);
      res.status(500).json({ error: 'Error al crear evento' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}

