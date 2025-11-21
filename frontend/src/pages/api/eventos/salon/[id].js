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
    const { id } = req.query;
    const { year, month } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'El año es requerido' });
    }

    let events;
    if (month) {
      events = await Event.findBySalonAndMonth(
        parseInt(id),
        parseInt(year),
        parseInt(month)
      );
    } else {
      events = await Event.findBySalonAndYear(parseInt(id), parseInt(year));
    }

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
}

