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
    let summary;

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

      summary = await Event.getSummaryByRange(dj_id, startDate, endDate);
    } else {
      if (!year || !month) {
        return res.status(400).json({ error: 'Año y mes son requeridos' });
      }

      summary = await Event.getMonthlySummary(
        dj_id,
        parseInt(year),
        parseInt(month)
      );
    }

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

