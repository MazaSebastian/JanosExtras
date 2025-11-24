import { authenticateToken } from '@/lib/auth.js';
import { Salon } from '@/lib/models/Salon.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const salon = await Salon.findById(parseInt(id));
      
      if (!salon) {
        return res.status(404).json({ error: 'Salón no encontrado' });
      }

      res.json(salon);
    } catch (error) {
      console.error('Error al obtener salón:', error);
      res.status(500).json({ error: 'Error al obtener salón' });
    }
  } else if (req.method === 'PATCH') {
    // Solo administradores pueden actualizar coordenadas
    if (auth.user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso restringido' });
    }

    try {
      const { latitud, longitud } = req.body;

      console.log('Recibiendo actualización de coordenadas:', {
        id: parseInt(id, 10),
        latitud,
        longitud,
        body: req.body,
      });

      if (latitud === undefined && longitud === undefined) {
        return res.status(400).json({ error: 'Se requiere al menos latitud o longitud' });
      }

      const salon = await Salon.updateCoordinates({
        id: parseInt(id, 10),
        latitud: latitud !== undefined ? parseFloat(latitud) : null,
        longitud: longitud !== undefined ? parseFloat(longitud) : null,
      });

      if (!salon) {
        return res.status(404).json({ error: 'Salón no encontrado' });
      }

      console.log('Coordenadas actualizadas exitosamente:', salon);

      res.json({ message: 'Coordenadas actualizadas', salon });
    } catch (error) {
      console.error('Error al actualizar coordenadas:', error);
      res.status(500).json({ error: error.message || 'Error al actualizar coordenadas' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}

