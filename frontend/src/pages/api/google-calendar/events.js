import { authenticateToken } from '@/lib/auth.js';
import { GoogleCalendarClient } from '@/lib/google-calendar/client.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

/**
 * Endpoint para crear eventos en Google Calendar desde una coordinación
 * POST /api/google-calendar/events
 */
export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'POST') {
    try {
      const { coordinacion_id, fecha, hora, duracion = 60, descripcion } = req.body;

      if (!coordinacion_id || !fecha || !hora) {
        return res.status(400).json({ 
          error: 'coordinacion_id, fecha y hora son requeridos' 
        });
      }

      // Verificar que la coordinación existe y pertenece al DJ
      const coordinacion = await Coordinacion.findById(coordinacion_id);
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }

      // Verificar permisos
      if (auth.user.rol !== 'admin' && coordinacion.dj_responsable_id !== auth.user.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para agendar videollamada en esta coordinación' 
        });
      }

      // Crear cliente de Google Calendar
      const calendarClient = new GoogleCalendarClient(auth.user.id);
      await calendarClient.initialize();

      // Construir fecha/hora de inicio y fin
      const startDateTime = new Date(`${fecha}T${hora}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duracion * 60 * 1000);

      // Preparar descripción del evento
      const eventDescription = descripcion || `
Coordinación: ${coordinacion.titulo}
Cliente: ${coordinacion.nombre_cliente || 'N/A'}
Tipo de Evento: ${coordinacion.tipo_evento || 'N/A'}
Fecha del Evento: ${coordinacion.fecha_evento || 'N/A'}
${coordinacion.telefono ? `Teléfono: ${coordinacion.telefono}` : ''}
${coordinacion.descripcion ? `\n\nNotas:\n${coordinacion.descripcion}` : ''}
      `.trim();

      // Crear evento en Google Calendar
      const eventResult = await calendarClient.createEvent({
        summary: `Coordinación: ${coordinacion.nombre_cliente || coordinacion.titulo} - ${coordinacion.tipo_evento || 'Evento'}`,
        description: eventDescription,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        timeZone: 'America/Argentina/Buenos_Aires',
        attendees: coordinacion.telefono ? [] : [], // Podríamos agregar email del cliente si está disponible
        conferenceData: true // Incluir Google Meet
      });

      // Actualizar coordinación con información del evento
      await Coordinacion.update(coordinacion_id, {
        google_calendar_event_id: eventResult.eventId,
        videollamada_agendada: true,
        videollamada_fecha: startDateTime,
        videollamada_duracion: duracion,
        videollamada_meet_link: eventResult.meetLink
      });

      return res.status(201).json({
        success: true,
        event: {
          id: eventResult.eventId,
          htmlLink: eventResult.htmlLink,
          meetLink: eventResult.meetLink,
          start: eventResult.start,
          end: eventResult.end
        }
      });
    } catch (error) {
      console.error('Error al crear evento en Google Calendar:', error);
      return res.status(500).json({ 
        error: 'Error al crear evento en Google Calendar',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

