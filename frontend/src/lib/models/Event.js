import pool from '../database.js';

export class Event {
  static async create({ dj_id, salon_id, fecha_evento }) {
    const checkQuery = `
      SELECT id FROM eventos 
      WHERE dj_id = $1 AND salon_id = $2 AND fecha_evento = $3
    `;
    const checkResult = await pool.query(checkQuery, [dj_id, salon_id, fecha_evento]);
    
    if (checkResult.rows.length > 0) {
      throw new Error('Ya existe un evento registrado para esta fecha y salón');
    }

    const fechaMarcado = new Date().toISOString();
    const query = `
      INSERT INTO eventos (dj_id, salon_id, fecha_evento, confirmado, fecha_marcado)
      VALUES ($1, $2, $3, true, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [dj_id, salon_id, fecha_evento, fechaMarcado]);
    return result.rows[0];
  }

  static async findBySalonAndMonth(salon_id, year, month) {
    const query = `
      SELECT 
        e.*,
        d.nombre as dj_nombre
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

  static async findByDJAndMonth(dj_id, year, month) {
    const query = `
      SELECT 
        e.*,
        s.nombre as salon_nombre
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

  static async getMonthlySummary(dj_id, year, month) {
    const query = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(DISTINCT salon_id) as total_salones
      FROM eventos
      WHERE dj_id = $1 
        AND EXTRACT(YEAR FROM fecha_evento) = $2
        AND EXTRACT(MONTH FROM fecha_evento) = $3
    `;
    const result = await pool.query(query, [dj_id, year, month]);
    return result.rows[0];
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

