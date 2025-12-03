import { authenticateToken } from '@/lib/auth.js';
import { GoogleCalendarToken } from '@/lib/models/GoogleCalendarToken.js';

/**
 * Endpoint para verificar si Google Calendar está conectado
 * GET /api/google-calendar/status
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const isConnected = await GoogleCalendarToken.isConnected(auth.user.id);
    const tokenData = await GoogleCalendarToken.findByDjId(auth.user.id);

    return res.json({
      connected: isConnected,
      hasToken: !!tokenData,
      expiryDate: tokenData?.expiry_date || null
    });
  } catch (error) {
    console.error('Error al verificar estado de Google Calendar:', error);
    return res.status(500).json({ error: 'Error al verificar estado' });
  }
}

