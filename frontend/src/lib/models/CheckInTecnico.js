import pool from '../database-config.js';
import { ESTADOS } from '../../utils/checkInTecnico.js';

export class CheckInTecnico {
  static async create({ dj_id, salon_id, fecha, evento_id, equipos, observaciones, estado_general }) {
    // Validar que equipos sea un array
    if (!Array.isArray(equipos)) {
      throw new Error('equipos debe ser un array');
    }

    // Asegurar que estado_general tenga un valor válido
    const estadoFinal = estado_general || ESTADOS.OK;

    // Si se proporciona fecha, convertirla a timestamp con la hora actual
    let fechaCheckIn;
    if (fecha) {
      const fechaDate = new Date(fecha);
      fechaCheckIn = fechaDate.toISOString();
    } else {
      fechaCheckIn = new Date().toISOString();
    }

    const query = `
      INSERT INTO check_in_tecnico (
        dj_id, 
        salon_id, 
        evento_id, 
        equipos, 
        observaciones, 
        estado_general,
        fecha_check_in
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      dj_id,
      salon_id,
      evento_id || null,
      JSON.stringify(equipos),
      observaciones || null,
      estadoFinal,
      fechaCheckIn,
    ]);

    // Parsear equipos JSONB
    const checkIn = result.rows[0];
    if (checkIn.equipos && typeof checkIn.equipos === 'string') {
      try {
        checkIn.equipos = JSON.parse(checkIn.equipos);
      } catch (e) {
        console.error('Error al parsear equipos:', e);
        checkIn.equipos = [];
      }
    }

    return checkIn;
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT 
        c.*,
        d.nombre as dj_nombre,
        s.nombre as salon_nombre,
        e.fecha_evento as evento_fecha
      FROM check_in_tecnico c
      INNER JOIN djs d ON c.dj_id = d.id
      INNER JOIN salones s ON c.salon_id = s.id
      LEFT JOIN eventos e ON c.evento_id = e.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Filtro por DJ
    if (filters.dj_id) {
      query += ` AND c.dj_id = $${paramIndex}`;
      params.push(filters.dj_id);
      paramIndex++;
    }

    // Filtro por salón
    if (filters.salon_id) {
      query += ` AND c.salon_id = $${paramIndex}`;
      params.push(filters.salon_id);
      paramIndex++;
    }

    // Filtro por estado
    if (filters.estado_general) {
      query += ` AND c.estado_general = $${paramIndex}`;
      params.push(filters.estado_general);
      paramIndex++;
    }

    // Filtro por rango de fechas
    if (filters.fecha_desde) {
      query += ` AND DATE(c.fecha_check_in) >= $${paramIndex}::date`;
      params.push(filters.fecha_desde);
      paramIndex++;
    }

    if (filters.fecha_hasta) {
      query += ` AND DATE(c.fecha_check_in) <= $${paramIndex}::date`;
      params.push(filters.fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY c.fecha_check_in DESC`;

    // Límite y offset para paginación
    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await pool.query(query, params);

    // Parsear equipos JSONB para cada check-in
    return result.rows.map((row) => {
      if (row.equipos && typeof row.equipos === 'string') {
        try {
          row.equipos = JSON.parse(row.equipos);
        } catch (e) {
          console.error('Error al parsear equipos:', e);
          row.equipos = [];
        }
      }
      return row;
    });
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.*,
        d.nombre as dj_nombre,
        s.nombre as salon_nombre,
        e.fecha_evento as evento_fecha
      FROM check_in_tecnico c
      INNER JOIN djs d ON c.dj_id = d.id
      INNER JOIN salones s ON c.salon_id = s.id
      LEFT JOIN eventos e ON c.evento_id = e.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const checkIn = result.rows[0];

    // Parsear equipos JSONB
    if (checkIn.equipos && typeof checkIn.equipos === 'string') {
      try {
        checkIn.equipos = JSON.parse(checkIn.equipos);
      } catch (e) {
        console.error('Error al parsear equipos:', e);
        checkIn.equipos = [];
      }
    }

    return checkIn;
  }

  static async update(id, { equipos, observaciones, estado_general }) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (equipos !== undefined) {
      if (!Array.isArray(equipos)) {
        throw new Error('equipos debe ser un array');
      }
      updates.push(`equipos = $${paramIndex}::jsonb`);
      params.push(JSON.stringify(equipos));
      paramIndex++;
    }

    if (observaciones !== undefined) {
      updates.push(`observaciones = $${paramIndex}`);
      params.push(observaciones);
      paramIndex++;
    }

    if (estado_general !== undefined) {
      updates.push(`estado_general = $${paramIndex}`);
      params.push(estado_general);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

    params.push(id);

    const query = `
      UPDATE check_in_tecnico
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const checkIn = result.rows[0];

    // Parsear equipos JSONB
    if (checkIn.equipos && typeof checkIn.equipos === 'string') {
      try {
        checkIn.equipos = JSON.parse(checkIn.equipos);
      } catch (e) {
        console.error('Error al parsear equipos:', e);
        checkIn.equipos = [];
      }
    }

    return checkIn;
  }

  static async delete(id) {
    const query = 'DELETE FROM check_in_tecnico WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getResumenGeneral(filters = {}) {
    let query = `
      SELECT 
        c.id,
        c.dj_id,
        c.salon_id,
        c.estado_general,
        c.fecha_check_in,
        d.nombre as dj_nombre,
        s.nombre as salon_nombre,
        COUNT(*) OVER() as total
      FROM check_in_tecnico c
      INNER JOIN djs d ON c.dj_id = d.id
      INNER JOIN salones s ON c.salon_id = s.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.dj_id) {
      query += ` AND c.dj_id = $${paramIndex}`;
      params.push(filters.dj_id);
      paramIndex++;
    }

    if (filters.salon_id) {
      query += ` AND c.salon_id = $${paramIndex}`;
      params.push(filters.salon_id);
      paramIndex++;
    }

    if (filters.fecha_desde) {
      query += ` AND DATE(c.fecha_check_in) >= $${paramIndex}::date`;
      params.push(filters.fecha_desde);
      paramIndex++;
    }

    if (filters.fecha_hasta) {
      query += ` AND DATE(c.fecha_check_in) <= $${paramIndex}::date`;
      params.push(filters.fecha_hasta);
      paramIndex++;
    }

    query += ` ORDER BY c.fecha_check_in DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }
}

