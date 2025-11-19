import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const auth = authenticateToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const dj = await DJ.findById(auth.user.id);
    if (!dj) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    res.json(dj);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

