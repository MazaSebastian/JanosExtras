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

  static async updateColor(id, color_hex) {
    const query = `
      UPDATE djs
      SET color_hex = $2
      WHERE id = $1
      RETURNING id, nombre, salon_id, rol, color_hex
    `;
    const result = await pool.query(query, [id, color_hex]);
    return result.rows[0];
  }
}

