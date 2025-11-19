import pool from '../database.js';
import bcrypt from 'bcryptjs';

export class DJ {
  static async create({ nombre, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const fechaRegistro = new Date().toISOString();
    const query = `
      INSERT INTO djs (nombre, password, fecha_registro)
      VALUES ($1, $2, $3)
      RETURNING id, nombre, fecha_registro
    `;
    const result = await pool.query(query, [nombre, hashedPassword, fechaRegistro]);
    return result.rows[0];
  }

  static async findByNombre(nombre) {
    const query = 'SELECT * FROM djs WHERE nombre = $1';
    const result = await pool.query(query, [nombre]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, nombre, fecha_registro FROM djs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

