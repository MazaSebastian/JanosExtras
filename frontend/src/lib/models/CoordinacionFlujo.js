import pool from '../database-config.js';

export class CoordinacionFlujo {
  static async findByCoordinacionId(coordinacion_id) {
    const query = `
      SELECT 
        id,
        coordinacion_id,
        paso_actual,
        tipo_evento,
        respuestas,
        estado,
        completado,
        fecha_inicio,
        fecha_actualizacion,
        fecha_completado
      FROM coordinaciones_flujo
      WHERE coordinacion_id = $1
      ORDER BY fecha_actualizacion DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [coordinacion_id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    // Parsear respuestas JSONB si es string
    if (row.respuestas && typeof row.respuestas === 'string') {
      try {
        row.respuestas = JSON.parse(row.respuestas);
      } catch (e) {
        console.error('Error al parsear respuestas:', e);
        row.respuestas = {};
      }
    }
    
    return row;
  }

  static async create({ coordinacion_id, paso_actual, tipo_evento, respuestas, estado = 'en_proceso' }) {
    // Primero verificar si existe
    const existing = await this.findByCoordinacionId(coordinacion_id);
    
    if (existing) {
      // Actualizar existente
      return await this.update(coordinacion_id, { paso_actual, respuestas, estado });
    }
    
    // Crear nuevo
    const query = `
      INSERT INTO coordinaciones_flujo (coordinacion_id, paso_actual, tipo_evento, respuestas, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, coordinacion_id, paso_actual, tipo_evento, respuestas, estado, completado, fecha_inicio, fecha_actualizacion, fecha_completado
    `;
    const result = await pool.query(query, [
      coordinacion_id,
      paso_actual,
      tipo_evento,
      JSON.stringify(respuestas),
      estado,
    ]);
    
    // Parsear respuestas JSONB si es string
    const row = result.rows[0];
    if (row.respuestas && typeof row.respuestas === 'string') {
      try {
        row.respuestas = JSON.parse(row.respuestas);
      } catch (e) {
        console.error('Error al parsear respuestas:', e);
        row.respuestas = {};
      }
    }
    
    return row;
  }

  static async update(coordinacion_id, { paso_actual, respuestas, estado, completado = false }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (paso_actual !== undefined) {
      updates.push(`paso_actual = $${paramIndex}`);
      values.push(paso_actual);
      paramIndex++;
    }

    if (respuestas !== undefined) {
      updates.push(`respuestas = $${paramIndex}`);
      values.push(JSON.stringify(respuestas));
      paramIndex++;
    }

    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }

    if (completado !== undefined) {
      updates.push(`completado = $${paramIndex}`);
      values.push(completado);
      paramIndex++;
      if (completado) {
        updates.push(`fecha_completado = CURRENT_TIMESTAMP`);
      }
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(coordinacion_id);
    paramIndex++;

    const query = `
      UPDATE coordinaciones_flujo
      SET ${updates.join(', ')}
      WHERE coordinacion_id = $${paramIndex}
      RETURNING id, coordinacion_id, paso_actual, tipo_evento, respuestas, estado, completado, fecha_inicio, fecha_actualizacion, fecha_completado
    `;
    const result = await pool.query(query, values);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    // Parsear respuestas JSONB si es string
    if (row.respuestas && typeof row.respuestas === 'string') {
      try {
        row.respuestas = JSON.parse(row.respuestas);
      } catch (e) {
        console.error('Error al parsear respuestas:', e);
        row.respuestas = {};
      }
    }
    
    return row;
  }

  static async complete(coordinacion_id, respuestas) {
    const query = `
      UPDATE coordinaciones_flujo
      SET 
        respuestas = $1,
        estado = 'completado',
        completado = true,
        fecha_completado = CURRENT_TIMESTAMP,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE coordinacion_id = $2
      RETURNING id, coordinacion_id, paso_actual, tipo_evento, respuestas, estado, completado, fecha_inicio, fecha_actualizacion, fecha_completado
    `;
    const result = await pool.query(query, [JSON.stringify(respuestas), coordinacion_id]);
    
    if (!result.rows[0]) return null;
    
    const row = result.rows[0];
    // Parsear respuestas JSONB si es string
    if (row.respuestas && typeof row.respuestas === 'string') {
      try {
        row.respuestas = JSON.parse(row.respuestas);
      } catch (e) {
        console.error('Error al parsear respuestas:', e);
        row.respuestas = {};
      }
    }
    
    return row;
  }
}

