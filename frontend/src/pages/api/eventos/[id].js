import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id } = req.query;
    const dj_id = auth.user.id;

    const deletedEvent = await Event.delete(parseInt(id), dj_id);
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Evento no encontrado o no tienes permisos' });
    }

    res.json({ message: 'Evento eliminado exitosamente', event: deletedEvent });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
}

