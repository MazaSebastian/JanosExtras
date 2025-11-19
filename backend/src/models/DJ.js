import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export class DJ {
  static async create({ nombre, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const fechaRegistro = new Date().toISOString();
    const query = `
      INSERT INTO djs (nombre, email, password, fecha_registro)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, email, fecha_registro
    `;
    const result = await pool.query(query, [nombre, email, hashedPassword, fechaRegistro]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM djs WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, nombre, email, fecha_registro FROM djs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

