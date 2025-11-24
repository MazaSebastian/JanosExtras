import { authenticateToken } from '@/lib/auth.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, estado, dj_responsable_id, salon_id } = req.query;
      const coordinaciones = await Coordinacion.findAll({
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        estado: estado || null,
        dj_responsable_id: dj_responsable_id ? parseInt(dj_responsable_id, 10) : null,
        salon_id: salon_id ? parseInt(salon_id, 10) : null,
      });
      return res.json(coordinaciones);
    } catch (error) {
      console.error('Error al obtener coordinaciones:', error);
      return res.status(500).json({ error: 'Error al obtener coordinaciones' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { titulo, descripcion, nombre_cliente, tipo_evento, codigo_evento, fecha_evento, hora_evento, salon_id, dj_responsable_id, estado, prioridad, notas } = req.body;

      // Generar título automáticamente si no se proporciona
      const tituloFinal = titulo || (nombre_cliente ? `${nombre_cliente} - ${tipo_evento || 'Evento'}` : 'Nueva Coordinación');

      const coordinacion = await Coordinacion.create({
        titulo: tituloFinal,
        descripcion: descripcion || null,
        nombre_cliente: nombre_cliente || null,
        tipo_evento: tipo_evento || null,
        codigo_evento: codigo_evento || null,
        fecha_evento: fecha_evento || null,
        hora_evento: hora_evento || null,
        salon_id: salon_id ? parseInt(salon_id, 10) : null,
        dj_responsable_id: dj_responsable_id ? parseInt(dj_responsable_id, 10) : null,
        estado: estado || 'pendiente',
        prioridad: prioridad || 'normal',
        notas: notas || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json(coordinacion);
    } catch (error) {
      console.error('Error al crear coordinación:', error);
      return res.status(500).json({ error: 'Error al crear coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

