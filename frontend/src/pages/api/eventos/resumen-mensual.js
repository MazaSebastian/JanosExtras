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

    // Agregar información de cotización y sueldo adicional
    const COTIZACION_EXTRA = 47000;
    const eventosExtras = summary.eventos_extras || 0;
    const sueldoAdicional = eventosExtras * COTIZACION_EXTRA;

    res.json({
      ...summary,
      cotizacion_extra: COTIZACION_EXTRA,
      sueldo_adicional: sueldoAdicional
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
}

