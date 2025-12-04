import { google } from 'googleapis';
import { GoogleCalendarToken } from '../models/GoogleCalendarToken.js';

/**
 * Cliente para interactuar con Google Calendar API
 */
export class GoogleCalendarClient {
  constructor(dj_id) {
    this.dj_id = dj_id;
    this.oauth2Client = null;
    this.calendar = null;
  }

  /**
   * Inicializar cliente OAuth con tokens del DJ
   */
  async initialize() {
    const tokenData = await GoogleCalendarToken.findByDjId(this.dj_id);
    
    if (!tokenData) {
      throw new Error('Google Calendar no está conectado para este DJ');
    }

    // Verificar si el token expiró
    const now = new Date();
    const expiry = new Date(tokenData.expiry_date);
    
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: expiry.getTime()
    });

    // Si el token expiró, intentar refrescarlo
    if (expiry <= now && tokenData.refresh_token) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Guardar nuevo token
        await GoogleCalendarToken.upsert(this.dj_id, {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || tokenData.refresh_token,
          expiry_date: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000),
          scope: credentials.scope,
          token_type: credentials.token_type
        });

        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error al refrescar token de Google Calendar:', error);
        throw new Error('Error al refrescar token de Google Calendar. Por favor, reconecta tu cuenta.');
      }
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    return this;
  }

  /**
   * Crear evento en Google Calendar
   */
  async createEvent({
    summary,
    description = '',
    startDateTime,
    endDateTime,
    timeZone = 'America/Argentina/Buenos_Aires',
    attendees = [],
    location = '',
    conferenceData = true // Incluir Google Meet
  }) {
    if (!this.calendar) {
      await this.initialize();
    }

    const event = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
        timeZone
      },
      end: {
        dateTime: endDateTime,
        timeZone
      },
      attendees: attendees.map(email => ({ email })),
      location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 24 horas antes
          { method: 'email', minutes: 60 } // 1 hora antes
        ]
      }
    };

    // Agregar Google Meet si se solicita
    if (conferenceData) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    try {
      console.log('📅 Creando evento en Google Calendar:', {
        summary,
        startDateTime,
        endDateTime,
        timeZone,
        calendarId: 'primary'
      });

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: conferenceData ? 1 : 0,
        requestBody: event
      });

      console.log('✅ Evento creado exitosamente:', {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
        start: response.data.start.dateTime,
        end: response.data.end.dateTime,
        calendarId: response.data.organizer?.email || 'primary'
      });

      // Verificar que el link de Meet se generó correctamente
      const meetLink = response.data.hangoutLink || 
                      response.data.conferenceData?.entryPoints?.[0]?.uri || 
                      null;
      
      if (!meetLink && conferenceData) {
        console.warn('⚠️ Se solicitó Google Meet pero no se generó el link');
      }

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: meetLink,
        start: response.data.start.dateTime,
        end: response.data.end.dateTime,
        calendarId: response.data.organizer?.email || 'primary'
      };
    } catch (error) {
      console.error('❌ Error al crear evento en Google Calendar:', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        details: error.response?.data,
        eventData: {
          summary,
          startDateTime,
          endDateTime,
          timeZone
        }
      });
      
      // Proporcionar mensaje de error más específico
      let errorMessage = `Error al crear evento: ${error.message}`;
      if (error.response?.data?.error) {
        const googleError = error.response.data.error;
        errorMessage = `Error de Google Calendar: ${googleError.message || googleError}`;
      } else if (error.code) {
        errorMessage = `Error de Google Calendar (${error.code}): ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Actualizar evento existente
   */
  async updateEvent(eventId, {
    summary,
    description,
    startDateTime,
    endDateTime,
    timeZone = 'America/Argentina/Buenos_Aires',
    attendees = [],
    location = ''
  }) {
    if (!this.calendar) {
      await this.initialize();
    }

    // Primero obtener el evento existente
    const existingEvent = await this.calendar.events.get({
      calendarId: 'primary',
      eventId
    });

    const event = {
      ...existingEvent.data,
      summary: summary || existingEvent.data.summary,
      description: description !== undefined ? description : existingEvent.data.description,
      start: {
        dateTime: startDateTime || existingEvent.data.start.dateTime,
        timeZone
      },
      end: {
        dateTime: endDateTime || existingEvent.data.end.dateTime,
        timeZone
      },
      attendees: attendees.length > 0 ? attendees.map(email => ({ email })) : existingEvent.data.attendees,
      location: location || existingEvent.data.location
    };

    try {
      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
        start: response.data.start.dateTime,
        end: response.data.end.dateTime
      };
    } catch (error) {
      console.error('Error al actualizar evento en Google Calendar:', error);
      throw new Error(`Error al actualizar evento: ${error.message}`);
    }
  }

  /**
   * Eliminar evento
   */
  async deleteEvent(eventId) {
    if (!this.calendar) {
      await this.initialize();
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar evento en Google Calendar:', error);
      throw new Error(`Error al eliminar evento: ${error.message}`);
    }
  }

  /**
   * Listar eventos en un rango de fechas
   */
  async listEvents(timeMin, timeMax, maxResults = 50) {
    if (!this.calendar) {
      await this.initialize();
    }

    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        htmlLink: event.htmlLink,
        meetLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
        location: event.location,
        attendees: event.attendees || []
      }));
    } catch (error) {
      console.error('Error al listar eventos de Google Calendar:', error);
      throw new Error(`Error al listar eventos: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad en un rango de tiempo
   */
  async checkAvailability(timeMin, timeMax) {
    if (!this.calendar) {
      await this.initialize();
    }

    try {
      const events = await this.listEvents(timeMin, timeMax);
      return {
        available: events.length === 0,
        conflictingEvents: events
      };
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      throw error;
    }
  }
}

