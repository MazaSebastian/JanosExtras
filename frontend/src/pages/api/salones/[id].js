import { authenticateToken } from '@/lib/auth.js';
import { Salon } from '@/lib/models/Salon.js';

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
    const salon = await Salon.findById(parseInt(id));
    
    if (!salon) {
      return res.status(404).json({ error: 'Salón no encontrado' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Error al obtener salón:', error);
    res.status(500).json({ error: 'Error al obtener salón' });
  }
}

