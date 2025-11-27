import pool from '../database-config.js';

export class Anuncio {
  static async findAll(filters = {}) {
    const { activo, tipo, prioridad, soloActivos = true } = filters;
    
    let query = `
      SELECT 
        a.*,
        d.nombre as creado_por_nombre
      FROM anuncios a
      LEFT JOIN djs d ON a.creado_por = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (soloActivos !== false) {
      query += ` AND a.activo = $${paramIndex}`;
      params.push(true);
      paramIndex++;
      
      // Filtrar por fechas si está activo
      query += ` AND (a.fecha_inicio IS NULL OR a.fecha_inicio <= CURRENT_TIMESTAMP)`;
      query += ` AND (a.fecha_fin IS NULL OR a.fecha_fin >= CURRENT_TIMESTAMP)`;
    } else if (activo !== undefined && activo !== null) {
      query += ` AND a.activo = $${paramIndex}`;
      params.push(activo);
      paramIndex++;
    }
    
    if (tipo) {
      query += ` AND a.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }
    
    if (prioridad) {
      query += ` AND a.prioridad = $${paramIndex}`;
      params.push(prioridad);
      paramIndex++;
    }
    
    query += ` ORDER BY 
      CASE a.prioridad
        WHEN 'urgente' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'baja' THEN 4
      END,
      a.fecha_creacion DESC
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        a.*,
        d.nombre as creado_por_nombre
      FROM anuncios a
      LEFT JOIN djs d ON a.creado_por = d.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      titulo,
      mensaje,
      tipo = 'info',
      prioridad = 'normal',
      activo = true,
      fecha_inicio,
      fecha_fin,
      creado_por,
    } = data;

    // Convertir fechas a formato ISO para PostgreSQL
    const fechaInicioDate = fecha_inicio 
      ? (fecha_inicio instanceof Date ? fecha_inicio : new Date(fecha_inicio))
      : new Date();
    
    const fechaFinDate = fecha_fin && fecha_fin !== ''
      ? (fecha_fin instanceof Date ? fecha_fin : new Date(fecha_fin))
      : null;

    const query = `
      INSERT INTO anuncios (
        titulo, mensaje, tipo, prioridad, activo,
        fecha_inicio, fecha_fin, creado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      titulo,
      mensaje,
      tipo,
      prioridad,
      activo,
      fechaInicioDate.toISOString(),
      fechaFinDate ? fechaFinDate.toISOString() : null,
      creado_por,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const {
      titulo,
      mensaje,
      tipo,
      prioridad,
      activo,
      fecha_inicio,
      fecha_fin,
    } = data;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (titulo !== undefined && titulo !== null) {
      updates.push(`titulo = $${paramIndex}`);
      values.push(titulo);
      paramIndex++;
    }

    if (mensaje !== undefined && mensaje !== null) {
      updates.push(`mensaje = $${paramIndex}`);
      values.push(mensaje);
      paramIndex++;
    }

    if (tipo !== undefined && tipo !== null) {
      updates.push(`tipo = $${paramIndex}`);
      values.push(tipo);
      paramIndex++;
    }

    if (prioridad !== undefined && prioridad !== null) {
      updates.push(`prioridad = $${paramIndex}`);
      values.push(prioridad);
      paramIndex++;
    }

    if (activo !== undefined && activo !== null) {
      updates.push(`activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (fecha_inicio !== undefined && fecha_inicio !== null && fecha_inicio !== '') {
      // Convertir fecha de formato datetime-local a ISO string para PostgreSQL
      const fechaInicioDate = fecha_inicio instanceof Date 
        ? fecha_inicio 
        : new Date(fecha_inicio);
      updates.push(`fecha_inicio = $${paramIndex}`);
      values.push(fechaInicioDate.toISOString());
      paramIndex++;
    }

    if (fecha_fin !== undefined) {
      // Si fecha_fin es una cadena vacía, convertir a null
      if (fecha_fin === null || fecha_fin === '') {
        updates.push(`fecha_fin = NULL`);
      } else {
        // Convertir fecha de formato datetime-local a ISO string para PostgreSQL
        const fechaFinDate = fecha_fin instanceof Date 
          ? fecha_fin 
          : new Date(fecha_fin);
        updates.push(`fecha_fin = $${paramIndex}`);
        values.push(fechaFinDate.toISOString());
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE anuncios
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM anuncios WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

