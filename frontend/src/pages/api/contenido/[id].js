import { authenticateToken } from '@/lib/auth.js';
import { Contenido } from '@/lib/models/Contenido.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const contenido = await Contenido.findById(id);
      if (!contenido) {
        return res.status(404).json({ error: 'Contenido no encontrado' });
      }
      return res.status(200).json({ data: contenido });
    } catch (error) {
      console.error('Error al obtener contenido:', error);
      return res.status(500).json({ error: 'Error al obtener contenido' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Todos los usuarios autenticados pueden actualizar contenido
      const { nombre, descripcion, url_descarga, categoria, tipo, activo } = req.body;

      const contenido = await Contenido.update(id, {
        nombre,
        descripcion,
        url_descarga,
        categoria,
        tipo,
        activo,
      });

      if (!contenido) {
        return res.status(404).json({ error: 'Contenido no encontrado' });
      }

      return res.status(200).json({ data: contenido });
    } catch (error) {
      console.error('Error al actualizar contenido:', error);
      return res.status(500).json({ error: 'Error al actualizar contenido' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Todos los usuarios autenticados pueden eliminar contenido
      const contenido = await Contenido.delete(id);
      if (!contenido) {
        return res.status(404).json({ error: 'Contenido no encontrado' });
      }
      return res.status(200).json({ message: 'Contenido eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
      return res.status(500).json({ error: 'Error al eliminar contenido' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

