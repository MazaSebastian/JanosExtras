import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';
import pool from '@/lib/database-config.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const dj = await DJ.findById(auth.user.id);
      if (!dj) {
        return res.status(404).json({ error: 'DJ no encontrado' });
      }
      return res.json(dj);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return res.status(500).json({ error: 'Error al obtener perfil' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const {
        notific_recordatorio_horas,
        notific_reuniones_dia,
        notific_precoordinacion_completada,
        disponibilidad_videollamada
      } = req.body;

      const query = `
        UPDATE djs
        SET 
          notific_recordatorio_horas = CASE WHEN $1::integer IS NOT NULL THEN $1::integer ELSE notific_recordatorio_horas END,
          notific_reuniones_dia = CASE WHEN $2::boolean IS NOT NULL THEN $2::boolean ELSE notific_reuniones_dia END,
          notific_precoordinacion_completada = CASE WHEN $3::boolean IS NOT NULL THEN $3::boolean ELSE notific_precoordinacion_completada END,
          disponibilidad_videollamada = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE disponibilidad_videollamada END
        WHERE id = $5
        RETURNING id, nombre, salon_id, rol, color_hex, notific_recordatorio_horas, notific_reuniones_dia, notific_precoordinacion_completada, disponibilidad_videollamada
      `;
      const result = await pool.query(query, [
        notific_recordatorio_horas !== undefined ? notific_recordatorio_horas : null,
        notific_reuniones_dia !== undefined ? notific_reuniones_dia : null,
        notific_precoordinacion_completada !== undefined ? notific_precoordinacion_completada : null,
        disponibilidad_videollamada !== undefined && disponibilidad_videollamada !== null ? JSON.stringify(disponibilidad_videollamada) : null,
        auth.user.id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'DJ no encontrado' });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

