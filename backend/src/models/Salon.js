import pool from '../config/database.js';

export class Salon {
  static async findAll() {
    const query = 'SELECT * FROM salones WHERE activo = true ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM salones WHERE id = $1 AND activo = true';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async create({ nombre, direccion }) {
    const query = `
      INSERT INTO salones (nombre, direccion, activo)
      VALUES ($1, $2, true)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, direccion]);
    return result.rows[0];
  }
}

