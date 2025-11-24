import pool from '../database-config.js';

export class Contenido {
  static async findAll({ activo = true, categoria = null, tipo = null } = {}) {
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

    if (tipo) {
      conditions.push(`tipo = $${paramIndex}`);
      values.push(tipo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        c.url_descarga,
        c.categoria,
        c.tipo,
        c.activo,
        c.fecha_creacion,
        c.fecha_actualizacion,
        d.nombre AS creado_por_nombre
      FROM contenido c
      LEFT JOIN djs d ON c.creado_por = d.id
      ${whereClause}
      ORDER BY c.fecha_creacion DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.descripcion,
        c.url_descarga,
        c.categoria,
        c.tipo,
        c.activo,
        c.creado_por,
        c.fecha_creacion,
        c.fecha_actualizacion,
        d.nombre AS creado_por_nombre
      FROM contenido c
      LEFT JOIN djs d ON c.creado_por = d.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create({ nombre, descripcion, url_descarga, categoria, tipo, creado_por }) {
    const query = `
      INSERT INTO contenido (nombre, descripcion, url_descarga, categoria, tipo, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, descripcion, url_descarga, categoria, tipo, activo, fecha_creacion
    `;
    const result = await pool.query(query, [nombre, descripcion, url_descarga, categoria, tipo, creado_por]);
    return result.rows[0];
  }

  static async update(id, { nombre, descripcion, url_descarga, categoria, tipo, activo }) {
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
    if (tipo !== undefined) {
      updates.push(`tipo = $${paramIndex}`);
      values.push(tipo);
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
      UPDATE contenido
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, nombre, descripcion, url_descarga, categoria, tipo, activo, fecha_creacion, fecha_actualizacion
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM contenido WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getCategorias() {
    const query = `
      SELECT DISTINCT categoria
      FROM contenido
      WHERE categoria IS NOT NULL AND activo = true
      ORDER BY categoria
    `;
    const result = await pool.query(query);
    return result.rows.map(row => row.categoria);
  }

  static async getTipos() {
    const query = `
      SELECT DISTINCT tipo
      FROM contenido
      WHERE tipo IS NOT NULL AND activo = true
      ORDER BY tipo
    `;
    const result = await pool.query(query);
    return result.rows.map(row => row.tipo);
  }
}

