import pool from '@/lib/database-config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token es requerido' });
  }

  try {
    // 1. Obtener la coordinación
    const coordQuery = `
      SELECT id, dj_responsable_id, videollamada_agendada, videollamada_fecha, videollamada_meet_link
      FROM coordinaciones
      WHERE pre_coordinacion_token = $1 AND activo = true
    `;
    const coordRes = await pool.query(coordQuery, [token]);
    if (coordRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-coordinación no encontrada' });
    }

    const coordinacion = coordRes.rows[0];
    
    // Si ya tiene una videollamada agendada, retornar los detalles de la misma
    if (coordinacion.videollamada_agendada) {
      return res.status(200).json({
        alreadyBooked: true,
        fecha: coordinacion.videollamada_fecha,
        meetLink: coordinacion.videollamada_meet_link
      });
    }

    const djId = coordinacion.dj_responsable_id;
    if (!djId) {
      return res.status(200).json({
        activo: false,
        message: 'No hay DJ asignado para este evento todavía'
      });
    }

    // 2. Obtener el DJ y su disponibilidad
    const djQuery = `
      SELECT nombre, disponibilidad_videollamada
      FROM djs
      WHERE id = $1 AND activo = true
    `;
    const djRes = await pool.query(djQuery, [djId]);
    if (djRes.rows.length === 0) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    const dj = djRes.rows[0];
    let disponibilidad = null;

    if (dj.disponibilidad_videollamada) {
      disponibilidad = typeof dj.disponibilidad_videollamada === 'string'
        ? JSON.parse(dj.disponibilidad_videollamada)
        : dj.disponibilidad_videollamada;
    }

    if (!disponibilidad || !disponibilidad.activo) {
      return res.status(200).json({
        activo: false,
        message: 'El DJ no tiene activa la disponibilidad para videollamadas'
      });
    }

    // 3. Obtener videollamadas ya agendadas de este DJ
    const bookingsQuery = `
      SELECT videollamada_fecha
      FROM coordinaciones
      WHERE dj_responsable_id = $1 
        AND videollamada_agendada = true 
        AND videollamada_fecha >= NOW()
        AND activo = true
    `;
    const bookingsRes = await pool.query(bookingsQuery, [djId]);
    const bookedDates = bookingsRes.rows.map(row => row.videollamada_fecha.toISOString());

    return res.status(200).json({
      activo: true,
      djNombre: dj.nombre,
      disponibilidad,
      bookedDates
    });
  } catch (error) {
    console.error('Error al obtener disponibilidad para cliente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
