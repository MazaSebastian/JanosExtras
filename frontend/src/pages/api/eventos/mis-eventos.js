import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const dj_id = auth.user.id;
    const { year, month, startDate, endDate } = req.query;

    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: 'Debes enviar ambas fechas (desde y hasta).' });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Rango de fechas inválido.' });
      }

      if (start > end) {
        return res
          .status(400)
          .json({ error: 'La fecha inicial no puede ser mayor a la final.' });
      }

      const eventsInRange = await Event.findByDJBetween(
        dj_id,
        startDate,
        endDate
      );
      return res.json(eventsInRange);
    }

    if (!year || !month) {
      return res.status(400).json({
        error: 'Año y mes son requeridos si no se envía un rango de fechas.',
      });
    }

    const events = await Event.findByDJAndMonth(
      dj_id,
      parseInt(year),
      parseInt(month)
    );

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
}

