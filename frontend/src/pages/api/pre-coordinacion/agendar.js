import pool from '@/lib/database-config.js';
import { GoogleCalendarClient } from '@/lib/google-calendar/client.js';
import { enviarNotificacionDJ } from '@/lib/pushNotifier.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { token, fecha, hora, duracion = 60 } = req.body;

    if (!token || !fecha || !hora) {
      return res.status(400).json({ error: 'Token, fecha y hora son requeridos' });
    }

    // 1. Obtener detalles de la coordinación por token
    const query = `
      SELECT 
        c.id, 
        c.titulo, 
        c.nombre_cliente, 
        c.nombre_agasajado, 
        c.tipo_evento, 
        c.fecha_evento,
        c.dj_responsable_id,
        c.telefono
      FROM coordinaciones c
      WHERE c.pre_coordinacion_token = $1
        AND c.activo = true
    `;
    const result = await pool.query(query, [token]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pre-coordinación no encontrada o inválida' });
    }

    const coordinacion = result.rows[0];
    const djId = coordinacion.dj_responsable_id;

    if (!djId) {
      return res.status(400).json({ error: 'No hay DJ asignado para este evento todavía' });
    }

    // Parsear fecha y hora para la videollamada
    const fechaFormateada = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const horaFormateada = hora.includes(':') ? hora : `${hora.substring(0, 2)}:${hora.substring(2)}`;
    const [horas, minutos] = horaFormateada.split(':').map(Number);
    const startDateTimeISO = `${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00-03:00`;

    // Calcular hora de fin
    const tempStartDate = new Date(`${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);
    const tempEndDate = new Date(tempStartDate.getTime() + duracion * 60 * 1000);
    const endHours = tempEndDate.getHours();
    const endMinutes = tempEndDate.getMinutes();
    const endDate = tempEndDate.getDate() !== tempStartDate.getDate() ? tempEndDate.toISOString().split('T')[0] : fechaFormateada;
    const endDateTimeISO = `${endDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00-03:00`;

    const videollamadaFecha = new Date(`${fechaFormateada}T${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:00`);

    let googleEventId = null;
    let meetLink = `https://meet.jit.si/JanosExtras-${coordinacion.id}`;

    // 3. Actualizar la coordinación
    const updateQuery = `
      UPDATE coordinaciones
      SET 
        videollamada_agendada = true,
        videollamada_fecha = $1,
        videollamada_duracion = $2,
        google_calendar_event_id = $3,
        videollamada_meet_link = $4
      WHERE id = $5
    `;
    await pool.query(updateQuery, [
      videollamadaFecha,
      duracion,
      googleEventId,
      meetLink,
      coordinacion.id
    ]);

    // 4. Enviar notificación push al DJ y administradores
    const clienteNombre = coordinacion.nombre_cliente || coordinacion.nombre_agasajado || 'Un cliente';
    
    // Formatear la fecha del evento para el mensaje
    let fechaEventoFormateada = '';
    if (coordinacion.fecha_evento) {
      try {
        const d = new Date(coordinacion.fecha_evento);
        const dia = String(d.getUTCDate()).padStart(2, '0');
        const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
        const anio = d.getUTCFullYear();
        fechaEventoFormateada = `${dia}/${mes}/${anio}`;
      } catch (e) {
        console.error(e);
      }
    }

    // Formatear datos de la videollamada para el mensaje
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const diaNombre = diasSemana[tempStartDate.getDay()];
    const parts = fechaFormateada.split('-');
    const videollamadaFechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
    const horaMsg = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')} hs`;

    const bodyText = `${clienteNombre} del día ${fechaEventoFormateada} ha agendado una videollamada con vos para el ${diaNombre} ${videollamadaFechaFormateada} a las ${horaMsg}! Clickea para ver los detalles.`;

    const payload = {
      title: '¡Videollamada agendada!',
      body: bodyText,
      url: `/dashboard/coordinaciones?coordinacionId=${coordinacion.id}`
    };

    const recipients = new Set();
    recipients.add(djId);

    // Obtener administradores
    const adminsResult = await pool.query("SELECT id FROM djs WHERE rol = 'admin'");
    adminsResult.rows.forEach(admin => recipients.add(admin.id));

    const promises = Array.from(recipients).map(id => 
      enviarNotificacionDJ(id, payload).catch(err => {
        console.error(`Error sending push notification to DJ ${id}:`, err);
      })
    );
    await Promise.all(promises);

    return res.status(200).json({
      success: true,
      message: 'Videollamada agendada con éxito',
      meetLink
    });
  } catch (error) {
    console.error('Error al agendar videollamada por cliente:', error);
    return res.status(500).json({ error: 'Error interno del servidor al agendar' });
  }
}
