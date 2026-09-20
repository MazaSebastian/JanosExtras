import pool from '../database-config.js';

export class DisponibilidadBloque {
  /**
   * Obtiene todos los bloques de un DJ para una fecha específica,
   * incluyendo los datos de la coordinación asignada si está ocupado.
   */
  static async findByDjAndDate(djId, fecha, salonId = null) {
    // Normalizar fecha en formato YYYY-MM-DD
    const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;

    const conditions = ['b.fecha = $1'];
    const values = [fechaStr];
    let paramIdx = 2;

    if (djId) {
      conditions.push(`b.dj_id = $${paramIdx}`);
      values.push(djId);
      paramIdx++;
    }

    if (salonId) {
      conditions.push(`(b.salon_id = $${paramIdx} OR b.salon_id IS NULL)`);
      values.push(salonId);
      paramIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const query = `
      SELECT 
        b.id,
        b.dj_id,
        b.salon_id,
        b.fecha,
        b.hora_inicio,
        b.hora_fin,
        b.estado,
        b.coordinacion_id,
        b.created_at,
        b.updated_at,
        c.nombre_cliente,
        c.apellido_cliente,
        c.nombre_agasajado,
        c.tipo_evento,
        c.titulo AS coordinacion_titulo,
        c.telefono AS cliente_telefono,
        c.videollamada_completada,
        s.nombre AS salon_nombre
      FROM disponibilidad_bloques b
      LEFT JOIN coordinaciones c ON b.coordinacion_id = c.id
      LEFT JOIN salones s ON b.salon_id = s.id
      ${whereClause}
      ORDER BY b.hora_inicio ASC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Crea un bloque individual de disponibilidad
   */
  static async create({ dj_id, salon_id = null, fecha, hora_inicio, hora_fin = null, estado = 'disponible', coordinacion_id = null }) {
    const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;

    const query = `
      INSERT INTO disponibilidad_bloques (
        dj_id, salon_id, fecha, hora_inicio, hora_fin, estado, coordinacion_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      dj_id,
      salon_id,
      fechaStr,
      hora_inicio,
      hora_fin,
      estado,
      coordinacion_id
    ]);

    return result.rows[0];
  }

  /**
   * Crea múltiples bloques en una sola operación
   */
  static async createBulk(bloques = []) {
    if (!bloques || bloques.length === 0) return [];

    const created = [];
    for (const b of bloques) {
      const nuevo = await this.create(b);
      if (nuevo) created.push(nuevo);
    }
    return created;
  }

  /**
   * Asigna un bloque a una coordinación y lo marca como 'ocupado'
   */
  static async assignToCoordination(bloqueId, coordinacionId) {
    const query = `
      UPDATE disponibilidad_bloques
      SET estado = 'ocupado', coordinacion_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [coordinacionId, bloqueId]);
    return result.rows[0];
  }

  /**
   * Libera todos los bloques asociados a una coordinación (los vuelve a 'disponible')
   */
  static async releaseByCoordination(coordinacionId) {
    const query = `
      UPDATE disponibilidad_bloques
      SET estado = 'disponible', coordinacion_id = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE coordinacion_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [coordinacionId]);
    return result.rows;
  }

  /**
   * Elimina un bloque por su ID (solo si no está ocupado o si se fuerza)
   */
  static async delete(bloqueId) {
    const query = `
      DELETE FROM disponibilidad_bloques
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [bloqueId]);
    return result.rows[0];
  }

  /**
   * Elimina todos los bloques libres de un DJ para una fecha
   */
  static async deleteFreeByDjAndDate(djId, fecha) {
    const fechaStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
    const query = `
      DELETE FROM disponibilidad_bloques
      WHERE dj_id = $1 AND fecha = $2 AND estado = 'disponible'
      RETURNING *
    `;
    const result = await pool.query(query, [djId, fechaStr]);
    return result.rows;
  }
}

export default DisponibilidadBloque;
