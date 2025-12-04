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
      // Asegurar formato correcto de fecha (YYYY-MM-DD) y hora (HH:MM)
      const fechaFormateada = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const horaFormateada = hora.includes(':') ? hora : `${hora.substring(0, 2)}:${hora.substring(2)}`;
      
      // IMPORTANTE: Crear la fecha en la zona horaria de Argentina (UTC-3)
      // El problema es que cuando creamos un Date y lo convertimos a ISO, se convierte a UTC
      // Solución: crear el string ISO directamente con la zona horaria de Argentina (-03:00)
      
      // Parsear la hora para obtener horas y minutos
      const [horas, minutos] = horaFormateada.split(':').map(Number);
      
      // Crear fecha de inicio en formato ISO con zona horaria de Argentina (UTC-3)
      // Formato: YYYY-MM-DDTHH:MM:SS-03:00
      const startDateTimeISO = `${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00-03:00`;
      
      // Calcular fecha de fin sumando la duración
      // Crear un objeto Date temporal para calcular la hora de fin
      // Usamos la fecha/hora como si fuera en Argentina (sin conversión UTC)
      const tempStartDate = new Date(`${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);
      const tempEndDate = new Date(tempStartDate.getTime() + duracion * 60 * 1000);
      
      // Extraer horas y minutos de la fecha de fin
      const endHours = tempEndDate.getHours();
      const endMinutes = tempEndDate.getMinutes();
      
      // Verificar si la duración hace que pase al día siguiente
      const endDate = tempEndDate.getDate() !== tempStartDate.getDate() 
        ? tempEndDate.toISOString().split('T')[0] 
        : fechaFormateada;
      
      // Crear fecha de fin en formato ISO con zona horaria de Argentina
      const endDateTimeISO = `${endDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00-03:00`;

      console.log('📅 Datos del evento a crear (con zona horaria corregida):', {
        fecha,
        hora,
        fechaFormateada,
        horaFormateada,
        horas,
        minutos,
        startDateTimeISO,
        endDateTimeISO,
        duracion,
        timeZone: 'America/Argentina/Buenos_Aires (UTC-3)'
      });

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
      const eventSummary = `Coordinación: ${coordinacion.nombre_cliente || coordinacion.titulo} - ${coordinacion.tipo_evento || 'Evento'}`;
      
      console.log('🚀 Iniciando creación de evento en Google Calendar:', {
        summary: eventSummary,
        coordinacion_id,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      });

      const eventResult = await calendarClient.createEvent({
        summary: eventSummary,
        description: eventDescription,
        startDateTime: startDateTimeISO, // Usar el formato ISO con zona horaria de Argentina
        endDateTime: endDateTimeISO, // Usar el formato ISO con zona horaria de Argentina
        timeZone: 'America/Argentina/Buenos_Aires',
        attendees: coordinacion.telefono ? [] : [], // Podríamos agregar email del cliente si está disponible
        conferenceData: true // Incluir Google Meet
      });

      console.log('✅ Evento creado, resultado:', {
        eventId: eventResult.eventId,
        htmlLink: eventResult.htmlLink,
        meetLink: eventResult.meetLink,
        calendarId: eventResult.calendarId
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

