import { authenticateToken } from '@/lib/auth.js';
import { Contenido } from '@/lib/models/Contenido.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, categoria, tipo } = req.query;
      const contenido = await Contenido.findAll({
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        categoria: categoria || null,
        tipo: tipo || null,
      });
      return res.status(200).json({ data: contenido });
    } catch (error) {
      console.error('Error al obtener contenido:', error);
      return res.status(500).json({ error: 'Error al obtener contenido' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Solo admins pueden crear contenido
      if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden crear contenido' });
      }

      const { nombre, descripcion, url_descarga, categoria, tipo } = req.body;

      if (!nombre || !url_descarga) {
        return res.status(400).json({ error: 'Nombre y URL de descarga son requeridos' });
      }

      const contenido = await Contenido.create({
        nombre,
        descripcion: descripcion || null,
        url_descarga,
        categoria: categoria || null,
        tipo: tipo || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json({ data: contenido });
    } catch (error) {
      console.error('Error al crear contenido:', error);
      return res.status(500).json({ error: 'Error al crear contenido' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

