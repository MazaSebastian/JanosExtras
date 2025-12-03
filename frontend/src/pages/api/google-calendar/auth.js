import { google } from 'googleapis';
import { authenticateToken } from '@/lib/auth.js';

/**
 * Endpoint para iniciar el flujo de autenticación OAuth con Google Calendar
 * GET /api/google-calendar/auth
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return res.status(500).json({ 
      error: 'Google Calendar no está configurado. Contacta al administrador.' 
    });
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  // Scopes necesarios para Google Calendar
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  // Generar URL de autorización
  // El state se usa para pasar el ID del usuario y recuperarlo en el callback
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necesario para obtener refresh_token
    scope: scopes,
    prompt: 'consent', // Forzar consentimiento para obtener refresh_token
    state: auth.user.id.toString() // Pasar el ID del usuario en el state para el callback
  });

  return res.json({ authUrl });
}

