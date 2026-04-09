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

    // Log the deletion attempt details
    console.log('[DELETE EVENT API] Attempting to delete event:', { id, parsedId: parseInt(id), userRol: auth.user.rol, userId: auth.user.id });

    let deletedEvent;

    if (auth.user.rol === 'admin' || auth.user.rol === 'gerencia') {
      // Admins can delete any event
      deletedEvent = await Event.deleteAsAdmin(parseInt(id));
    } else {
      // DJs can only delete their own events
      const dj_id = auth.user.id;
      deletedEvent = await Event.delete(parseInt(id), dj_id);
    }

    console.log('[DELETE EVENT API] Result:', deletedEvent);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Evento no encontrado o no tienes permisos' });
    }

    res.json({ message: 'Evento eliminado exitosamente', event: deletedEvent });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
}

