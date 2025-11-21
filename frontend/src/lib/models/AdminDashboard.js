import pool from '../database-config.js';

export class AdminDashboard {
  static async getSummary(year, month) {
    const query = `
      WITH eventos_filtrados AS (
        SELECT *
        FROM eventos
        WHERE EXTRACT(YEAR FROM fecha_evento) = $1
          AND EXTRACT(MONTH FROM fecha_evento) = $2
      ),
      eventos_por_dj AS (
        SELECT dj_id, COUNT(*) AS total_eventos
        FROM eventos_filtrados
        GROUP BY dj_id
      )
      SELECT
        (SELECT COUNT(*) FROM djs) AS total_djs,
        (SELECT COUNT(*) FROM salones) AS total_salones,
        (SELECT COUNT(*) FROM eventos_filtrados) AS total_eventos_mes,
        (SELECT COUNT(DISTINCT salon_id) FROM eventos_filtrados) AS salones_con_eventos,
        (SELECT COUNT(DISTINCT dj_id) FROM eventos_filtrados) AS djs_con_eventos,
        COALESCE((
          SELECT SUM(GREATEST(total_eventos - 8, 0))
          FROM eventos_por_dj
        ), 0) AS total_eventos_extras
      `;

    const result = await pool.query(query, [year, month]);
    const data = result.rows[0] || {};

    const totalEventos = parseInt(data.total_eventos_mes, 10) || 0;
    const djsConEventos = parseInt(data.djs_con_eventos, 10) || 0;

    return {
      total_djs: parseInt(data.total_djs, 10) || 0,
      total_salones: parseInt(data.total_salones, 10) || 0,
      total_eventos_mes: totalEventos,
      salones_con_eventos: parseInt(data.salones_con_eventos, 10) || 0,
      djs_con_eventos: djsConEventos,
      total_eventos_extras: parseInt(data.total_eventos_extras, 10) || 0,
      promedio_eventos_por_dj:
        djsConEventos > 0 ? Number((totalEventos / djsConEventos).toFixed(2)) : 0
    };
  }

  static async getDJStats(year, month) {
    const query = `
      SELECT 
        d.id,
        d.nombre,
        d.rol,
        d.salon_id,
        s.nombre AS salon_nombre,
        COALESCE(COUNT(e.id), 0) AS total_eventos,
        COALESCE(MAX(e.fecha_evento), NULL) AS ultimo_evento
      FROM djs d
      LEFT JOIN salones s ON s.id = d.salon_id
      LEFT JOIN eventos e 
        ON e.dj_id = d.id 
        AND EXTRACT(YEAR FROM e.fecha_evento) = $1
        AND EXTRACT(MONTH FROM e.fecha_evento) = $2
      GROUP BY d.id, d.nombre, d.rol, d.salon_id, s.nombre
      ORDER BY total_eventos DESC, d.nombre ASC
    `;

    const result = await pool.query(query, [year, month]);

    return result.rows.map((dj) => {
      const totalEventos = parseInt(dj.total_eventos, 10) || 0;
      return {
        ...dj,
        total_eventos: totalEventos,
        eventos_extras: Math.max(0, totalEventos - 8),
        ultimo_evento: dj.ultimo_evento
      };
    });
  }

  static async getSalonStats(year, month) {
    const query = `
      SELECT 
        s.id,
        s.nombre,
        COALESCE(COUNT(e.id), 0) AS total_eventos,
        COALESCE(COUNT(DISTINCT e.dj_id), 0) AS djs_activos
      FROM salones s
      LEFT JOIN eventos e 
        ON e.salon_id = s.id
        AND EXTRACT(YEAR FROM e.fecha_evento) = $1
        AND EXTRACT(MONTH FROM e.fecha_evento) = $2
      GROUP BY s.id, s.nombre
      ORDER BY total_eventos DESC, s.nombre ASC
    `;

    const result = await pool.query(query, [year, month]);
    return result.rows.map((salon) => ({
      ...salon,
      total_eventos: parseInt(salon.total_eventos, 10) || 0,
      djs_activos: parseInt(salon.djs_activos, 10) || 0,
    }));
  }
}

