import pool from '../database-config.js';

export class AdicionalTecnica {
  static async create({ salon_id, fecha_evento, adicionales, notas, archivo_pdf_url, creado_por }) {
    try {
      const query = `
        INSERT INTO adicionales_tecnica (salon_id, fecha_evento, adicionales, notas, archivo_pdf_url, creado_por)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (salon_id, fecha_evento)
        DO UPDATE SET
          adicionales = EXCLUDED.adicionales,
          notas = EXCLUDED.notas,
          archivo_pdf_url = EXCLUDED.archivo_pdf_url,
          fecha_actualizacion = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await pool.query(query, [
        salon_id,
        fecha_evento,
        JSON.stringify(adicionales),
        notas || null,
        archivo_pdf_url || null,
        creado_por || null,
      ]);
      const row = result.rows[0];
      // Parsear JSONB si viene como string
      if (row && row.adicionales && typeof row.adicionales === 'string') {
        row.adicionales = JSON.parse(row.adicionales);
      }
      return row;
    } catch (error) {
      if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
        throw new Error('La tabla adicionales_tecnica no existe. Por favor, ejecuta el script SQL para crearla.');
      }
      throw error;
    }
  }

  static async findBySalonAndDate(salon_id, fecha_evento) {
    const query = `
      SELECT 
        at.*,
        s.nombre as salon_nombre
      FROM adicionales_tecnica at
      INNER JOIN salones s ON at.salon_id = s.id
      WHERE at.salon_id = $1 AND at.fecha_evento = $2
    `;
    const result = await pool.query(query, [salon_id, fecha_evento]);
    const row = result.rows[0] || null;
    if (row && row.adicionales && typeof row.adicionales === 'string') {
      row.adicionales = JSON.parse(row.adicionales);
    }
    return row;
  }

  static async findAll({ salon_id = null, fecha_evento = null, startDate = null, endDate = null } = {}) {
    try {
      let query = `
        SELECT 
          at.*,
          s.nombre as salon_nombre
        FROM adicionales_tecnica at
        INNER JOIN salones s ON at.salon_id = s.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (salon_id) {
        query += ` AND at.salon_id = $${paramIndex}`;
        params.push(salon_id);
        paramIndex++;
      }

      if (fecha_evento) {
        query += ` AND at.fecha_evento = $${paramIndex}`;
        params.push(fecha_evento);
        paramIndex++;
      }

      if (startDate) {
        query += ` AND at.fecha_evento >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND at.fecha_evento <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` ORDER BY at.fecha_evento DESC, s.nombre ASC`;

      const result = await pool.query(query, params);
      // Parsear JSONB adicionales
      return result.rows.map(row => {
        if (row.adicionales && typeof row.adicionales === 'string') {
          row.adicionales = JSON.parse(row.adicionales);
        }
        return row;
      });
    } catch (error) {
      // Si la tabla no existe, devolver array vacío
      if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') && error.message.includes('does not exist'))) {
        console.warn('Tabla adicionales_tecnica no existe aún. Ejecuta el script SQL para crearla.');
        return [];
      }
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM adicionales_tecnica WHERE id = $1';
    await pool.query(query, [id]);
  }
}

