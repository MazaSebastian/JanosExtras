import { authenticateToken } from '@/lib/auth.js';
import { Show } from '@/lib/models/Show.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, categoria } = req.query;
      const shows = await Show.findAll({
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        categoria: categoria || null,
      });
      return res.status(200).json({ data: shows });
    } catch (error) {
      console.error('Error al obtener shows:', error);
      return res.status(500).json({ error: 'Error al obtener shows' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Solo admins pueden crear shows (área artística)
      if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden crear shows' });
      }

      const { nombre, descripcion, url_audio, duracion, categoria } = req.body;

      if (!nombre || !url_audio) {
        return res.status(400).json({ error: 'Nombre y URL de audio son requeridos' });
      }

      const show = await Show.create({
        nombre,
        descripcion: descripcion || null,
        url_audio,
        duracion: duracion ? parseInt(duracion, 10) : null,
        categoria: categoria || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json({ data: show });
    } catch (error) {
      console.error('Error al crear show:', error);
      return res.status(500).json({ error: 'Error al crear show' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

