import { authenticateToken } from '@/lib/auth.js';
import { Software } from '@/lib/models/Software.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, categoria } = req.query;
      const software = await Software.findAll({
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        categoria: categoria || null,
      });
      return res.status(200).json({ data: software });
    } catch (error) {
      console.error('Error al obtener software:', error);
      return res.status(500).json({ error: 'Error al obtener software' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { nombre, descripcion, url_descarga, categoria } = req.body;

      if (!nombre || !url_descarga) {
        return res.status(400).json({ error: 'Nombre y URL de descarga son requeridos' });
      }

      const software = await Software.create({
        nombre,
        descripcion: descripcion || null,
        url_descarga,
        categoria: categoria || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json({ data: software });
    } catch (error) {
      console.error('Error al crear software:', error);
      return res.status(500).json({ error: 'Error al crear software' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

