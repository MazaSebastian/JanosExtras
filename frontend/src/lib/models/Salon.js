import pool from '../database-config.js';

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

  static async updateCoordinates({ id, latitud, longitud }) {
    console.log('Salon.updateCoordinates llamado con:', { id, latitud, longitud });
    
    const query = `
      UPDATE salones
      SET latitud = $1, longitud = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const latValue = latitud !== null && latitud !== undefined ? parseFloat(latitud) : null;
    const lngValue = longitud !== null && longitud !== undefined ? parseFloat(longitud) : null;
    
    console.log('Valores a insertar:', { latValue, lngValue, id });
    
    const result = await pool.query(query, [latValue, lngValue, id]);
    
    console.log('Resultado de la query:', result.rows[0]);
    
    return result.rows[0];
  }
}

