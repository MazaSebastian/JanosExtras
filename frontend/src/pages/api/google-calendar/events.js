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

      // Construir fecha/hora de inicio y fin
      const fechaFormateada = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const horaFormateada = hora.includes(':') ? hora : `${hora.substring(0, 2)}:${hora.substring(2)}`;
      const [horas, minutos] = horaFormateada.split(':').map(Number);
      const startDateTimeISO = `${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00-03:00`;
      
      const tempStartDate = new Date(`${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);
      const tempEndDate = new Date(tempStartDate.getTime() + duracion * 60 * 1000);
      const endHours = tempEndDate.getHours();
      const endMinutes = tempEndDate.getMinutes();
      const endDate = tempEndDate.getDate() !== tempStartDate.getDate() 
        ? tempEndDate.toISOString().split('T')[0] 
        : fechaFormateada;
      const endDateTimeISO = `${endDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00-03:00`;

      // Crear objeto Date para guardar en la base de datos (sin zona horaria, solo fecha/hora)
      const videollamadaFecha = new Date(`${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);
      const meetLink = `https://meet.jit.si/JanosExtras-${coordinacion_id}`;

      // Actualizar coordinación con información del evento
      await Coordinacion.update(coordinacion_id, {
        google_calendar_event_id: null,
        videollamada_agendada: true,
        videollamada_fecha: videollamadaFecha,
        videollamada_duracion: duracion,
        videollamada_meet_link: meetLink
      });

      return res.status(201).json({
        success: true,
        event: {
          id: null,
          htmlLink: null,
          meetLink: meetLink,
          start: startDateTimeISO,
          end: endDateTimeISO
        }
      });
    } catch (error) {
      console.error('❌ Error al crear evento en Google Calendar:', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Proporcionar mensaje de error más específico
      let errorMessage = 'Error al crear evento en Google Calendar';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        details: error.response?.data || error.message,
        code: error.code || error.response?.status
      });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

