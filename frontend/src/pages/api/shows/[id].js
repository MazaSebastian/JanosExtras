import { authenticateToken } from '@/lib/auth.js';
import { Show } from '@/lib/models/Show.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const show = await Show.findById(parseInt(id, 10));
      if (!show) {
        return res.status(404).json({ error: 'Show no encontrado' });
      }
      return res.status(200).json({ data: show });
    } catch (error) {
      console.error('Error al obtener show:', error);
      return res.status(500).json({ error: 'Error al obtener show' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Solo admins pueden actualizar shows (área artística)
      if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden actualizar shows' });
      }

      const { nombre, descripcion, url_audio, duracion, categoria, activo } = req.body;
      const show = await Show.update(parseInt(id, 10), {
        nombre,
        descripcion,
        url_audio,
        duracion: duracion ? parseInt(duracion, 10) : undefined,
        categoria,
        activo,
      });

      if (!show) {
        return res.status(404).json({ error: 'Show no encontrado' });
      }

      return res.status(200).json({ data: show });
    } catch (error) {
      console.error('Error al actualizar show:', error);
      return res.status(500).json({ error: 'Error al actualizar show' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Solo admins pueden eliminar shows (área artística)
      if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden eliminar shows' });
      }

      const show = await Show.delete(parseInt(id, 10));
      if (!show) {
        return res.status(404).json({ error: 'Show no encontrado' });
      }
      return res.json({ message: 'Show eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar show:', error);
      return res.status(500).json({ error: 'Error al eliminar show' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

