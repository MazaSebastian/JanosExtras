import { requireRole } from '@/lib/middleware/security.js';
import { Event } from '@/lib/models/Event.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = requireRole(req, ['admin']);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const { id } = req.query;
    const dj_id = parseInt(id, 10);

    if (isNaN(dj_id)) {
      return res.status(400).json({ error: 'ID de DJ inválido' });
    }

    // Obtener todos los eventos del DJ (sin filtro de fecha)
    const eventos = await Event.findByDJ(dj_id);

    res.json(eventos);
  } catch (error) {
    console.error('Error al obtener eventos del DJ:', error);
    res.status(500).json({ error: 'Error al obtener eventos del DJ' });
  }
}

