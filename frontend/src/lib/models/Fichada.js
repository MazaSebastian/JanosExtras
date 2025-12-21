import pool from '../database-config.js';
import { validateLocation } from '../utils/geolocation.js';
import { retryWithBackoff, isRetryableError } from '../utils/retry.js';

export class Fichada {
  static async create({ dj_id, tipo, comentario = null, latitud, longitud }) {
    // Usar retry logic para errores transitorios de conexión
    return retryWithBackoff(
      async () => {
        // Usar transacción para garantizar consistencia
        const client = await pool.connect();

        try {
          await client.query('BEGIN');

          // Obtener última fichada y datos del DJ/salón en una sola query optimizada
          // Usa LATERAL JOIN para obtener la última fichada eficientemente (más rápido que subquery)
          const validationQuery = `
            SELECT 
              lf.tipo AS last_tipo,
              lf.registrado_en AS last_registro,
              d.id AS dj_id,
              d.salon_id,
              s.id AS salon_id_check,
              s.latitud AS salon_latitud,
              s.longitud AS salon_longitud
            FROM djs d
            LEFT JOIN LATERAL (
              SELECT tipo, registrado_en
              FROM fichadas
              WHERE dj_id = d.id
              ORDER BY registrado_en DESC
              LIMIT 1
            ) lf ON true
            LEFT JOIN salones s ON s.id = d.salon_id
            WHERE d.id = $1
            LIMIT 1
          `;

          const validationResult = await client.query(validationQuery, [dj_id]);
          const validation = validationResult.rows[0];

          if (!validation) {
            await client.query('ROLLBACK');
            throw new Error('DJ no encontrado.');
          }

          // Validar secuencia de fichadas
          if (validation.last_tipo === tipo) {
            await client.query('ROLLBACK');
            throw new Error(
              tipo === 'ingreso'
                ? 'Ya registraste un ingreso. Debes marcar un egreso antes de volver a ingresar.'
                : 'Ya registraste un egreso. Debes marcar un ingreso antes de volver a egresar.'
            );
          }

          // Validar geolocalización solo para ingresos
          if (tipo === 'ingreso') {
            if (!validation.salon_id) {
              await client.query('ROLLBACK');
              throw new Error('No tienes un salón asignado. Contacta al administrador.');
            }

            if (!validation.salon_id_check) {
              await client.query('ROLLBACK');
              throw new Error('No se encontró información del salón asignado.');
            }

            // Validar ubicación
            if (!latitud || !longitud) {
              await client.query('ROLLBACK');
              throw new Error(
                'Se requiere tu ubicación para registrar el ingreso. Por favor, permite el acceso a la geolocalización.'
              );
            }

            const locationValidation = validateLocation(
              latitud,
              longitud,
              validation.salon_latitud,
              validation.salon_longitud,
              500 // Radio máximo de 500 metros
            );

            if (!locationValidation.valid) {
              await client.query('ROLLBACK');
              throw new Error(locationValidation.message);
            }
          }

          // Insertar fichada
          const insertQuery = `
            INSERT INTO fichadas (dj_id, tipo, comentario)
            VALUES ($1, $2, $3)
            RETURNING id, dj_id, tipo, comentario, registrado_en
          `;
          const insertResult = await client.query(insertQuery, [dj_id, tipo, comentario]);

          await client.query('COMMIT');
          return insertResult.rows[0];
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      {
        maxRetries: 2,
        initialDelay: 200,
        maxDelay: 1000,
        shouldRetry: isRetryableError,
      }
    );
  }

  static async getLastByDJ(dj_id) {
    const query = `
      SELECT id, dj_id, tipo, comentario, registrado_en
      FROM fichadas
      WHERE dj_id = $1
      ORDER BY registrado_en DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [dj_id]);
    return result.rows[0] || null;
  }

  static async findByDJ(dj_id, { from, to, limit = 50 }) {
    const conditions = ['dj_id = $1'];
    const values = [dj_id];

    if (from) {
      conditions.push(`registrado_en >= $${values.length + 1}`);
      values.push(from);
    }

    if (to) {
      conditions.push(`registrado_en <= $${values.length + 1}`);
      values.push(to);
    }

    const query = `
      SELECT id, dj_id, tipo, comentario, registrado_en
      FROM fichadas
      WHERE ${conditions.join(' AND ')}
      ORDER BY registrado_en DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findAll({ dj_id, tipo, from, to, limit = 100 }) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (dj_id) {
      conditions.push(`f.dj_id = $${paramIndex}`);
      values.push(dj_id);
      paramIndex++;
    }

    if (tipo) {
      conditions.push(`f.tipo = $${paramIndex}`);
      values.push(tipo);
      paramIndex++;
    }

    if (from) {
      conditions.push(`f.registrado_en >= $${paramIndex}`);
      values.push(from);
      paramIndex++;
    }

    if (to) {
      conditions.push(`f.registrado_en <= $${paramIndex}`);
      values.push(to);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        f.id,
        f.dj_id,
        f.tipo,
        f.comentario,
        f.registrado_en,
        d.nombre AS dj_nombre,
        d.color_hex AS dj_color,
        s.nombre AS salon_nombre
      FROM fichadas f
      INNER JOIN djs d ON f.dj_id = d.id
      LEFT JOIN salones s ON d.salon_id = s.id
      ${whereClause}
      ORDER BY f.registrado_en DESC
      LIMIT $${paramIndex}
    `;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getLiveStatus() {
    const query = `
      SELECT 
        d.id, 
        d.nombre, 
        d.rol, 
        d.salon_id,
        s.nombre as salon_nombre,
        f.tipo as ultimo_tipo,
        f.registrado_en as ultima_fichada,
        f.latitud, 
        f.longitud
      FROM djs d
      LEFT JOIN salones s ON d.salon_id = s.id
      LEFT JOIN LATERAL (
        SELECT tipo, registrado_en, latitud, longitud
        FROM fichadas
        WHERE dj_id = d.id
        ORDER BY registrado_en DESC
        LIMIT 1
      ) f ON true
      WHERE d.activo = true
      ORDER BY d.nombre ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getExportData({ startDate, endDate }) {
    let query = `
    SELECT
    f.id,
      f.registrado_en,
      f.tipo,
      f.comentario,
      d.nombre as dj_nombre,
      s.nombre as salon_nombre
      FROM fichadas f
      JOIN djs d ON f.dj_id = d.id
      LEFT JOIN salones s ON d.salon_id = s.id
      WHERE 1 = 1
      `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND f.registrado_en >= $${paramCount} `;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND f.registrado_en <= $${paramCount} `;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY f.registrado_en DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }
}


