import { authenticateToken } from '@/lib/auth.js';
import { AdminDashboard } from '@/lib/models/AdminDashboard.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (auth.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }

  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;

  if (isNaN(year) || isNaN(month)) {
    return res.status(400).json({ error: 'Parámetros de fecha inválidos' });
  }

  try {
    const summary = await AdminDashboard.getSummary(year, month);
    const djs = await AdminDashboard.getDJStats(year, month);
    const salones = await AdminDashboard.getSalonStats(year, month);

    res.json({
      filters: { year, month },
      summary,
      djs,
      salones,
    });
  } catch (error) {
    console.error('Error al obtener dashboard admin:', error);
    res.status(500).json({ error: 'Error al obtener datos administrativos' });
  }
}

