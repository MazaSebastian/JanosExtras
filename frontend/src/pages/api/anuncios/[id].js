import { authenticateToken } from '@/lib/auth.js';
import { Anuncio } from '@/lib/models/Anuncio.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const anuncio = await Anuncio.findById(id);
      if (!anuncio) {
        return res.status(404).json({ error: 'Anuncio no encontrado' });
      }
      return res.json(anuncio);
    } catch (error) {
      console.error('Error al obtener anuncio:', error);
      return res.status(500).json({ error: 'Error al obtener anuncio' });
    }
  }

  if (req.method === 'PATCH') {
    // Solo admins pueden editar anuncios
    if (auth.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden editar anuncios' });
    }

    try {
      const {
        titulo,
        mensaje,
        tipo,
        prioridad,
        activo,
        fecha_inicio,
        fecha_fin,
      } = req.body;

      const anuncioActualizado = await Anuncio.update(id, {
        titulo,
        mensaje,
        tipo,
        prioridad,
        activo,
        fecha_inicio,
        fecha_fin,
      });

      if (!anuncioActualizado) {
        return res.status(404).json({ error: 'Anuncio no encontrado' });
      }

      return res.json(anuncioActualizado);
    } catch (error) {
      console.error('Error al actualizar anuncio:', error);
      return res.status(500).json({ error: 'Error al actualizar anuncio' });
    }
  }

  if (req.method === 'DELETE') {
    // Solo admins pueden eliminar anuncios
    if (auth.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden eliminar anuncios' });
    }

    try {
      const anuncioEliminado = await Anuncio.delete(id);
      if (!anuncioEliminado) {
        return res.status(404).json({ error: 'Anuncio no encontrado' });
      }
      return res.json({ message: 'Anuncio eliminado exitosamente' });
    } catch (error) {
      console.error('Error al eliminar anuncio:', error);
      return res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

