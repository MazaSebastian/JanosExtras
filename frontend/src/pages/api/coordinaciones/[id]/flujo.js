import { authenticateToken } from '@/lib/auth.js';
import { CoordinacionFlujo } from '@/lib/models/CoordinacionFlujo.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const flujo = await CoordinacionFlujo.findByCoordinacionId(parseInt(id, 10));
      
      if (!flujo) {
        return res.status(404).json({ error: 'Flujo de coordinación no encontrado' });
      }

      // Parsear respuestas JSONB si es string
      if (flujo.respuestas && typeof flujo.respuestas === 'string') {
        try {
          flujo.respuestas = JSON.parse(flujo.respuestas);
        } catch (e) {
          console.error('Error al parsear respuestas:', e);
          flujo.respuestas = {};
        }
      }

      return res.json(flujo);
    } catch (error) {
      console.error('Error al obtener flujo de coordinación:', error);
      return res.status(500).json({ error: 'Error al obtener flujo de coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

