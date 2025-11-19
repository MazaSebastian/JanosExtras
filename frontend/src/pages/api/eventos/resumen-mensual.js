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
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    const summary = await Event.getMonthlySummary(
      dj_id,
      parseInt(year),
      parseInt(month)
    );

    res.json(summary);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
}

