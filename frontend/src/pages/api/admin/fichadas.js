import { authenticateToken } from '@/lib/auth.js';
import { Fichada } from '@/lib/models/Fichada.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Solo administradores pueden ver todas las fichadas
  if (auth.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }

  try {
    const { dj_id, tipo, startDate, endDate, limit } = req.query;

    const fichadas = await Fichada.findAll({
      dj_id: dj_id ? parseInt(dj_id, 10) : null,
      tipo: tipo || null,
      from: startDate || null,
      to: endDate || null,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    res.json(fichadas);
  } catch (error) {
    console.error('Error al obtener fichadas:', error);
    res.status(500).json({ error: 'Error al obtener fichadas' });
  }
}

