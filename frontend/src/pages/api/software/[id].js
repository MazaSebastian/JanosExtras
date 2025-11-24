import { authenticateToken } from '@/lib/auth.js';
import { Software } from '@/lib/models/Software.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const software = await Software.findById(parseInt(id, 10));
      if (!software) {
        return res.status(404).json({ error: 'Software no encontrado' });
      }
      return res.status(200).json({ data: software });
    } catch (error) {
      console.error('Error al obtener software:', error);
      return res.status(500).json({ error: 'Error al obtener software' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { nombre, descripcion, url_descarga, categoria, activo } = req.body;
      const software = await Software.update(parseInt(id, 10), {
        nombre,
        descripcion,
        url_descarga,
        categoria,
        activo,
      });

      if (!software) {
        return res.status(404).json({ error: 'Software no encontrado' });
      }

      return res.status(200).json({ data: software });
    } catch (error) {
      console.error('Error al actualizar software:', error);
      return res.status(500).json({ error: 'Error al actualizar software' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const software = await Software.delete(parseInt(id, 10));
      if (!software) {
        return res.status(404).json({ error: 'Software no encontrado' });
      }
      return res.json({ message: 'Software eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar software:', error);
      return res.status(500).json({ error: 'Error al eliminar software' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

