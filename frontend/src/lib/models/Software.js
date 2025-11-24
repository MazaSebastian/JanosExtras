import pool from '../database-config.js';

export class Software {
  static async findAll({ activo = true, categoria = null } = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (activo !== null) {
      conditions.push(`activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (categoria) {
      conditions.push(`categoria = $${paramIndex}`);
      values.push(categoria);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        s.id,
        s.nombre,
        s.descripcion,
        s.url_descarga,
        s.categoria,
        s.activo,
        s.fecha_creacion,
        s.fecha_actualizacion,
        d.nombre AS creado_por_nombre
      FROM software s
      LEFT JOIN djs d ON s.creado_por = d.id
      ${whereClause}
      ORDER BY s.fecha_creacion DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        s.id,
        s.nombre,
        s.descripcion,
        s.url_descarga,
        s.categoria,
        s.activo,
        s.creado_por,
        s.fecha_creacion,
        s.fecha_actualizacion,
        d.nombre AS creado_por_nombre
      FROM software s
      LEFT JOIN djs d ON s.creado_por = d.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create({ nombre, descripcion, url_descarga, categoria, creado_por }) {
    const query = `
      INSERT INTO software (nombre, descripcion, url_descarga, categoria, creado_por)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre, descripcion, url_descarga, categoria, activo, fecha_creacion
    `;
    const result = await pool.query(query, [nombre, descripcion, url_descarga, categoria, creado_por]);
    return result.rows[0];
  }

  static async update(id, { nombre, descripcion, url_descarga, categoria, activo }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex}`);
      values.push(nombre);
      paramIndex++;
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
      paramIndex++;
    }
    if (url_descarga !== undefined) {
      updates.push(`url_descarga = $${paramIndex}`);
      values.push(url_descarga);
      paramIndex++;
    }
    if (categoria !== undefined) {
      updates.push(`categoria = $${paramIndex}`);
      values.push(categoria);
      paramIndex++;
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE software
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nombre, descripcion, url_descarga, categoria, activo, fecha_creacion, fecha_actualizacion
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM software WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getCategorias() {
    const query = `
      SELECT DISTINCT categoria
      FROM software
      WHERE categoria IS NOT NULL AND activo = true
      ORDER BY categoria
    `;
    const result = await pool.query(query);
    return result.rows.map(row => row.categoria);
  }
}

