import { authenticateToken } from '@/lib/auth.js';
import { GoogleCalendarToken } from '@/lib/models/GoogleCalendarToken.js';

/**
 * Endpoint para desconectar Google Calendar
 * DELETE /api/google-calendar/disconnect
 */
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    await GoogleCalendarToken.deleteByDjId(auth.user.id);
    return res.json({ success: true, message: 'Google Calendar desconectado correctamente' });
  } catch (error) {
    console.error('Error al desconectar Google Calendar:', error);
    return res.status(500).json({ error: 'Error al desconectar Google Calendar' });
  }
}

