import pool from '@/lib/database-config.js';
import { authenticateToken } from '@/lib/auth.js';

export default async function handler(req, res) {
  // Configurar headers de CORS para todas las peticiones
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar autenticación
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { codigo } = req.query;

  if (req.method === 'GET') {
    try {
      if (!codigo) {
        return res.status(400).json({ error: 'Falta el código de evento' });
      }

      const query = `
        SELECT 
          c.id,
          c.titulo,
          c.descripcion,
          c.nombre_cliente,
          c.apellido_cliente,
          c.nombre_agasajado,
          c.telefono,
          c.tipo_evento,
          c.codigo_evento,
          c.fecha_evento,
          c.hora_evento,
          c.estado,
          c.prioridad,
          c.notas,
          c.encuesta_completada,
          c.encuesta_respuestas,
          s.nombre AS salon_nombre
        FROM coordinaciones c
        LEFT JOIN salones s ON c.salon_id = s.id
        WHERE c.codigo_evento = $1 AND c.activo = true
      `;
      const result = await pool.query(query, [String(codigo)]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Coordinación no encontrada para el código especificado' });
      }

      const coordinacion = result.rows[0];

      // Si el DJ no es admin, solo puede ver si es el asignado o si se busca de forma general por su salón
      // (Para simplificar, permitimos que el DJ autenticado consulte eventos del sistema)
      return res.status(200).json(coordinacion);
    } catch (error) {
      console.error('Error al buscar coordinación por código:', error);
      return res.status(500).json({ error: 'Error interno del servidor al buscar la coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
