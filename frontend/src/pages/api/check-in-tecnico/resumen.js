import { authenticateToken } from '@/lib/auth.js';
import { CheckInTecnico } from '@/lib/models/CheckInTecnico.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Solo admins pueden ver el resumen general
  if (auth.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }

  try {
    const { dj_id, salon_id, fecha_desde, fecha_hasta } = req.query;

    const filters = {
      dj_id: dj_id || null,
      salon_id: salon_id || null,
      fecha_desde: fecha_desde || null,
      fecha_hasta: fecha_hasta || null,
    };

    const resumen = await CheckInTecnico.getResumenGeneral(filters);
    return res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen de check-ins técnicos:', error);
    return res.status(500).json({ error: 'Error al obtener resumen de check-ins técnicos' });
  }
}

