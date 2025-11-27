import { authenticateToken } from '@/lib/auth.js';
import { Anuncio } from '@/lib/models/Anuncio.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { activo, tipo, prioridad, soloActivos } = req.query;
      
      // Para DJs, solo mostrar anuncios activos y visibles
      // Para admins, pueden ver todos si especifican soloActivos=false
      const filters = {
        activo: activo === 'false' ? false : activo === 'true' ? true : null,
        tipo: tipo || null,
        prioridad: prioridad || null,
        // DJs ven TODOS los anuncios (sin filtrar por activo ni fechas)
        // Solo se ocultan si fueron eliminados o descartados por el usuario
        soloActivos: auth.user.rol === 'admin' 
          ? soloActivos === 'false' ? false : true 
          : false, // DJs ven todos los anuncios
      };

      const anuncios = await Anuncio.findAll(filters);
      return res.json(anuncios);
    } catch (error) {
      console.error('Error al obtener anuncios:', error);
      return res.status(500).json({ error: 'Error al obtener anuncios' });
    }
  }

  if (req.method === 'POST') {
    // Solo admins pueden crear anuncios
    if (auth.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden crear anuncios' });
    }

    try {
      const { titulo, mensaje, tipo, prioridad, activo, fecha_inicio, fecha_fin } = req.body;

      if (!titulo || !mensaje) {
        return res.status(400).json({ error: 'Título y mensaje son requeridos' });
      }

      // Convertir fecha_fin vacía a null
      const fechaFinNormalizada = fecha_fin && fecha_fin !== '' ? fecha_fin : null;
      const fechaInicioNormalizada = fecha_inicio || new Date();

      const nuevoAnuncio = await Anuncio.create({
        titulo,
        mensaje,
        tipo: tipo || 'info',
        prioridad: prioridad || 'normal',
        activo: activo !== undefined ? activo : true,
        fecha_inicio: fechaInicioNormalizada,
        fecha_fin: fechaFinNormalizada,
        creado_por: auth.user.id,
      });

      return res.status(201).json(nuevoAnuncio);
    } catch (error) {
      console.error('Error al crear anuncio:', error);
      return res.status(500).json({ error: 'Error al crear anuncio' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

