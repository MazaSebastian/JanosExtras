import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';
import pool from '@/lib/database-config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  // Permitir acceso tanto a admins como a DJs
  if (auth.user.rol !== 'admin' && auth.user.rol !== 'dj') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }

  const { fecha } = req.query;

  if (!fecha) {
    return res.status(400).json({ error: 'La fecha es requerida' });
  }

  try {
    // Obtener todos los DJs
    const todosLosDJsResult = await pool.query(
      'SELECT id, nombre, salon_id, color_hex FROM djs WHERE rol = $1 ORDER BY nombre',
      ['dj']
    );
    const todosLosDJs = todosLosDJsResult.rows;

    // Obtener eventos de la fecha especificada
    const eventos = await Event.findByDate(fecha);

    // Crear un Set con los IDs de DJs ocupados
    const djsOcupadosIds = new Set(eventos.map(e => e.dj_id));

    // Separar DJs en libres y ocupados
    const djsLibres = todosLosDJs
      .filter(dj => !djsOcupadosIds.has(dj.id))
      .map(dj => ({
        ...dj,
        disponible: true,
      }));

    const djsOcupados = todosLosDJs
      .filter(dj => djsOcupadosIds.has(dj.id))
      .map(dj => {
        const eventosDelDJ = eventos.filter(e => e.dj_id === dj.id);
        return {
          ...dj,
          disponible: false,
          eventos: eventosDelDJ.map(e => ({
            id: e.id,
            salon_id: e.salon_id,
            salon_nombre: e.salon_nombre,
            fecha_evento: e.fecha_evento,
            confirmado: e.confirmado,
          })),
        };
      });

    res.json({
      fecha,
      djsLibres,
      djsOcupados,
      totalLibres: djsLibres.length,
      totalOcupados: djsOcupados.length,
      totalDJs: todosLosDJs.length,
    });
  } catch (error) {
    console.error('Error al obtener fechas libres:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidad de DJs' });
  }
}

