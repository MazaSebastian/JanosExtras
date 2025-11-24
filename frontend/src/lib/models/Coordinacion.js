import pool from '../database-config.js';

export class Coordinacion {
  static async findAll({ activo = true, estado = null, dj_responsable_id = null, salon_id = null } = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (activo !== null) {
      conditions.push(`c.activo = $${paramIndex}`);
      values.push(activo);
      paramIndex++;
    }

    if (estado) {
      conditions.push(`c.estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }

    if (dj_responsable_id) {
      conditions.push(`c.dj_responsable_id = $${paramIndex}`);
      values.push(dj_responsable_id);
      paramIndex++;
    }

    if (salon_id) {
      conditions.push(`c.salon_id = $${paramIndex}`);
      values.push(salon_id);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        c.id,
        c.titulo,
        c.descripcion,
        c.nombre_cliente,
        c.tipo_evento,
        c.codigo_evento,
        c.fecha_evento,
        c.hora_evento,
        c.salon_id,
        c.dj_responsable_id,
        c.estado,
        c.prioridad,
        c.notas,
        c.activo,
        c.fecha_creacion,
        c.fecha_actualizacion,
        d.nombre AS dj_responsable_nombre,
        d.color_hex AS dj_responsable_color,
        s.nombre AS salon_nombre,
        creador.nombre AS creado_por_nombre
      FROM coordinaciones c
      LEFT JOIN djs d ON c.dj_responsable_id = d.id
      LEFT JOIN salones s ON c.salon_id = s.id
      LEFT JOIN djs creador ON c.creado_por = creador.id
      ${whereClause}
      ORDER BY c.fecha_evento DESC NULLS LAST, c.fecha_creacion DESC
    `;

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT 
        c.id,
        c.titulo,
        c.descripcion,
        c.nombre_cliente,
        c.tipo_evento,
        c.codigo_evento,
        c.fecha_evento,
        c.hora_evento,
        c.salon_id,
        c.dj_responsable_id,
        c.estado,
        c.prioridad,
        c.notas,
        c.activo,
        c.creado_por,
        c.fecha_creacion,
        c.fecha_actualizacion,
        d.nombre AS dj_responsable_nombre,
        d.color_hex AS dj_responsable_color,
        s.nombre AS salon_nombre,
        creador.nombre AS creado_por_nombre
      FROM coordinaciones c
      LEFT JOIN djs d ON c.dj_responsable_id = d.id
      LEFT JOIN salones s ON c.salon_id = s.id
      LEFT JOIN djs creador ON c.creado_por = creador.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async create({ titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, creado_por }) {
    const query = `
      INSERT INTO coordinaciones (titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, activo, fecha_creacion
    `;
    const result = await pool.query(query, [
      titulo,
      descripcion || null,
      nombre_cliente || null,
      tipo_evento || null,
      codigo_evento || null,
      fecha_evento || null,
      hora_evento || null,
      salon_id || null,
      dj_responsable_id || null,
      estado || 'pendiente',
      prioridad || 'normal',
      notas || null,
      creado_por,
    ]);
    return result.rows[0];
  }

  static async update(id, { titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, activo }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (titulo !== undefined) {
      updates.push(`titulo = $${paramIndex}`);
      values.push(titulo);
      paramIndex++;
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex}`);
      values.push(descripcion);
      paramIndex++;
    }
    if (nombre_cliente !== undefined) {
      updates.push(`nombre_cliente = $${paramIndex}`);
      values.push(nombre_cliente);
      paramIndex++;
    }
    if (tipo_evento !== undefined) {
      updates.push(`tipo_evento = $${paramIndex}`);
      values.push(tipo_evento);
      paramIndex++;
    }
    if (codigo_evento !== undefined) {
      updates.push(`codigo_evento = $${paramIndex}`);
      values.push(codigo_evento);
      paramIndex++;
    }
    if (fecha_evento !== undefined) {
      updates.push(`fecha_evento = $${paramIndex}`);
      values.push(fecha_evento);
      paramIndex++;
    }
    if (hora_evento !== undefined) {
      updates.push(`hora_evento = $${paramIndex}`);
      values.push(hora_evento);
      paramIndex++;
    }
    if (salon_id !== undefined) {
      updates.push(`salon_id = $${paramIndex}`);
      values.push(salon_id);
      paramIndex++;
    }
    if (dj_responsable_id !== undefined) {
      updates.push(`dj_responsable_id = $${paramIndex}`);
      values.push(dj_responsable_id);
      paramIndex++;
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex}`);
      values.push(estado);
      paramIndex++;
    }
    if (prioridad !== undefined) {
      updates.push(`prioridad = $${paramIndex}`);
      values.push(prioridad);
      paramIndex++;
    }
    if (notas !== undefined) {
      updates.push(`notas = $${paramIndex}`);
      values.push(notas);
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
      UPDATE coordinaciones
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, titulo, descripcion, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas, activo, fecha_creacion, fecha_actualizacion
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id) {
    const query = `DELETE FROM coordinaciones WHERE id = $1 RETURNING id`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getEstados() {
    return ['pendiente', 'en_proceso', 'completada', 'cancelada'];
  }

  static async getPrioridades() {
    return ['baja', 'normal', 'alta', 'urgente'];
  }
}

