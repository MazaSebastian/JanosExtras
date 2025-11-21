import pool from '../database-config.js';
import bcrypt from 'bcryptjs';

export class DJ {
  static async create({ nombre, password, salon_id, rol = 'dj', color_hex = null }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const fechaRegistro = new Date().toISOString();
    const query = `
      INSERT INTO djs (nombre, password, salon_id, rol, color_hex, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, nombre, salon_id, rol, color_hex, fecha_registro
    `;
    const result = await pool.query(query, [nombre, hashedPassword, salon_id, rol, color_hex, fechaRegistro]);
    return result.rows[0];
  }

  static async findByNombre(nombre) {
    const query = 'SELECT * FROM djs WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, nombre, salon_id, rol, color_hex, fecha_registro FROM djs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateAdminFields({ id, nombre, salon_id, color_hex }) {
    const fields = [];
    const values = [];

    if (nombre) {
      fields.push(`nombre = $${fields.length + 1}`);
      values.push(nombre);
    }

    if (salon_id !== undefined) {
      fields.push(`salon_id = $${fields.length + 1}`);
      values.push(salon_id || null);
    }

    if (color_hex !== undefined) {
      fields.push(`color_hex = $${fields.length + 1}`);
      values.push(color_hex || null);
    }

    if (fields.length === 0) {
      return null;
    }

    const query = `
      UPDATE djs
      SET ${fields.join(', ')}
      WHERE id = $${fields.length + 1}
      RETURNING id, nombre, salon_id, rol, color_hex
    `;
    values.push(id);
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

