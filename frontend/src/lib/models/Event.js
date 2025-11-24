import pool from '../database-config.js';

const MAX_DJS_PER_EVENT = 3;

export class Event {
  static async create({ dj_id, salon_id, fecha_evento }) {
    const normalizedDate = new Date(fecha_evento);
    const existingForSalon = await pool.query(
      `
        SELECT id, dj_id
        FROM eventos
        WHERE salon_id = $1
          AND fecha_evento = $2
        ORDER BY fecha_marcado ASC
      `,
      [salon_id, normalizedDate]
    );

    if (existingForSalon.rows.some((event) => event.dj_id === dj_id)) {
      throw new Error('Ya has registrado un evento para esta fecha y salón');
    }

    if (existingForSalon.rows.length >= MAX_DJS_PER_EVENT) {
      throw new Error('Este salón ya tiene 3 DJs asignados en esa fecha');
    }

    const fechaMarcado = new Date().toISOString();
    const query = `
      INSERT INTO eventos (dj_id, salon_id, fecha_evento, confirmado, fecha_marcado)
      VALUES ($1, $2, $3, true, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [dj_id, salon_id, normalizedDate, fechaMarcado]);
    return result.rows[0];
  }

  static async findBySalonAndMonth(salon_id, year, month) {
    const query = `
      SELECT 
        e.*,
        d.nombre as dj_nombre,
        d.id as dj_id,
        d.salon_id as dj_salon_id,
        d.color_hex as dj_color_hex
      FROM eventos e
      INNER JOIN djs d ON e.dj_id = d.id
      WHERE e.salon_id = $1 
        AND EXTRACT(YEAR FROM e.fecha_evento) = $2
        AND EXTRACT(MONTH FROM e.fecha_evento) = $3
      ORDER BY e.fecha_evento
    `;
    const result = await pool.query(query, [salon_id, year, month]);
    return result.rows;
  }

  static async findByDJ(dj_id) {
    const query = `
      SELECT 
        e.*,
        s.nombre as salon_nombre,
        s.id as salon_id
      FROM eventos e
      INNER JOIN salones s ON e.salon_id = s.id
      WHERE e.dj_id = $1
      ORDER BY e.fecha_evento DESC
    `;
    const result = await pool.query(query, [dj_id]);
    return result.rows;
  }

  static async findByDJAndMonth(dj_id, year, month) {
    const query = `
      SELECT 
        e.*,
        s.nombre as salon_nombre,
        s.id as salon_id
      FROM eventos e
      INNER JOIN salones s ON e.salon_id = s.id
      WHERE e.dj_id = $1 
        AND EXTRACT(YEAR FROM e.fecha_evento) = $2
        AND EXTRACT(MONTH FROM e.fecha_evento) = $3
      ORDER BY e.fecha_evento
    `;
    const result = await pool.query(query, [dj_id, year, month]);
    return result.rows;
  }

  static async findByDJBetween(dj_id, startDate, endDate) {
    const query = `
      SELECT 
        e.*,
        s.nombre as salon_nombre,
        s.id as salon_id
      FROM eventos e
      INNER JOIN salones s ON e.salon_id = s.id
      WHERE e.dj_id = $1 
        AND DATE(e.fecha_evento) BETWEEN $2 AND $3
      ORDER BY e.fecha_evento
    `;
    const result = await pool.query(query, [dj_id, startDate, endDate]);
    return result.rows;
  }

  static async getMonthlySummary(dj_id, year, month) {
    const monthlyQuery = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(DISTINCT salon_id) as total_salones
      FROM eventos
      WHERE dj_id = $1 
        AND EXTRACT(YEAR FROM fecha_evento) = $2
        AND EXTRACT(MONTH FROM fecha_evento) = $3
    `;
    const totalQuery = `
      SELECT 
        COUNT(*) as total_eventos
      FROM eventos
      WHERE dj_id = $1
    `;

    const [monthlyResult, totalResult] = await Promise.all([
      pool.query(monthlyQuery, [dj_id, year, month]),
      pool.query(totalQuery, [dj_id]),
    ]);

    const monthlyData = monthlyResult.rows[0] || {};
    const totalData = totalResult.rows[0] || {};

    const eventosMes = parseInt(monthlyData.total_eventos, 10) || 0;
    const totalEventosHistorico = parseInt(totalData.total_eventos, 10) || 0;
    const eventosExtras = Math.max(0, eventosMes - 8);

    return {
      total_eventos: totalEventosHistorico,
      total_salones: parseInt(monthlyData.total_salones, 10) || 0,
      eventos_mes: eventosMes,
      eventos_extras: eventosExtras,
    };
  }

  static async getSummaryByRange(dj_id, startDate, endDate) {
    const query = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(DISTINCT salon_id) as total_salones
      FROM eventos
      WHERE dj_id = $1 
        AND DATE(fecha_evento) BETWEEN $2 AND $3
    `;
    const result = await pool.query(query, [dj_id, startDate, endDate]);
    const data = result.rows[0];
    const totalEventos = parseInt(data.total_eventos) || 0;
    const eventosExtras = Math.max(0, totalEventos - 8);
    return {
      ...data,
      total_eventos: totalEventos,
      eventos_extras: eventosExtras
    };
  }

  static async findBySalonAndYear(salon_id, year) {
    const query = `
      SELECT 
        e.*,
        d.nombre as dj_nombre,
        d.id as dj_id,
        d.salon_id as dj_salon_id,
        d.color_hex as dj_color_hex
      FROM eventos e
      INNER JOIN djs d ON e.dj_id = d.id
      WHERE e.salon_id = $1 
        AND EXTRACT(YEAR FROM e.fecha_evento) = $2
      ORDER BY e.fecha_evento
    `;
    const result = await pool.query(query, [salon_id, year]);
    return result.rows;
  }

  static async delete(event_id, dj_id) {
    const query = `
      DELETE FROM eventos 
      WHERE id = $1 AND dj_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [event_id, dj_id]);
    return result.rows[0];
  }
}

