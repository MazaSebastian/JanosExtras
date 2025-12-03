import { google } from 'googleapis';
import { GoogleCalendarToken } from '@/lib/models/GoogleCalendarToken.js';

/**
 * Endpoint callback de OAuth de Google Calendar
 * GET /api/google-calendar/callback?code=...&state=...
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/dashboard/coordinaciones?google_calendar_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect('/dashboard/coordinaciones?google_calendar_error=missing_params');
  }

  const dj_id = parseInt(state, 10);
  if (isNaN(dj_id)) {
    return res.redirect('/dashboard/coordinaciones?google_calendar_error=invalid_state');
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return res.redirect('/dashboard/coordinaciones?google_calendar_error=not_configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  try {
    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Calcular fecha de expiración
    const expiryDate = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000); // 1 hora por defecto

    // Guardar tokens en la base de datos
    await GoogleCalendarToken.upsert(dj_id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: expiryDate,
      scope: tokens.scope,
      token_type: tokens.token_type || 'Bearer'
    });

    return res.redirect('/dashboard/coordinaciones?google_calendar_connected=true');
  } catch (error) {
    console.error('Error en callback de Google Calendar:', error);
    return res.redirect(`/dashboard/coordinaciones?google_calendar_error=${encodeURIComponent(error.message)}`);
  }
}

