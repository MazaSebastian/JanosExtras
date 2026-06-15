import pool from '@/lib/database-config.js';
import { enviarNotificacionDJ } from '@/lib/pushNotifier.js';

export default async function handler(req, res) {
  // Solo permitir solicitudes GET para el cron job
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar autenticación mediante CRON_SECRET
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const report = {
      reunionAlarmasEnviadas: 0,
      resumenDiarioEnviado: false,
      resumenDJsNotificados: []
    };

    // --- 1. ALARMAS HORARIAS DE PROXIMIDAD DE REUNIONES ---
    // Buscar todas las videollamadas agendadas activas no completadas en las próximas 4 horas
    const upcomingMeetingsQuery = `
      SELECT 
        c.id, 
        c.titulo, 
        c.nombre_cliente, 
        c.nombre_agasajado, 
        c.videollamada_fecha, 
        c.dj_responsable_id,
        d.nombre AS dj_nombre,
        COALESCE(d.notific_recordatorio_horas, 2) AS recordatorio_horas,
        s.nombre AS salon_nombre
      FROM coordinaciones c
      JOIN djs d ON c.dj_responsable_id = d.id
      LEFT JOIN salones s ON c.salon_id = s.id
      WHERE c.activo = true 
        AND c.videollamada_agendada = true 
        AND c.videollamada_completada = false
        AND c.videollamada_fecha >= timezone('America/Argentina/Buenos_Aires', NOW()) - INTERVAL '15 minutes'
        AND c.videollamada_fecha <= timezone('America/Argentina/Buenos_Aires', NOW()) + INTERVAL '4 hours'
    `;

    const meetingsResult = await pool.query(upcomingMeetingsQuery);
    const nowMs = Date.now();

    for (const row of meetingsResult.rows) {
      const meetingTime = new Date(row.videollamada_fecha).getTime();
      const nowMs = Date.now();
      const diffMinutes = Math.round((meetingTime - nowMs) / (60 * 1000));
      const targetMinutes = row.recordatorio_horas * 60;

      // Si la reunión ocurre dentro del rango de tolerancia (ventana de 15 min del cron)
      if (diffMinutes >= targetMinutes - 7 && diffMinutes <= targetMinutes + 7) {
        const clienteNombre = row.nombre_agasajado || row.nombre_cliente || 'cliente';
        const payload = {
          title: '⏰ Recordatorio de Reunión',
          body: `Tu videollamada "${row.titulo}" con ${clienteNombre} comienza en ${row.recordatorio_horas} hora/s.`,
          url: `/dashboard/coordinaciones`
        };

        await enviarNotificacionDJ(row.dj_responsable_id, payload);
        report.reunionAlarmasEnviadas++;
      }
    }

    // --- 2. RESUMEN DIARIO DE REUNIONES Y EVENTOS (A LAS 09:00 AM HORA ARGENTINA) ---
    const localTimeStr = new Date().toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const [hour, minute] = localTimeStr.split(':').map(Number);
    // Ejecutar si el cron se llama entre las 9:00 y las 9:15, o si se pasa ?testDaily=true
    if ((hour === 9 && minute >= 0 && minute < 15) || req.query.testDaily === 'true') {
      report.resumenDiarioEnviado = true;

      // 1. Obtener todos los DJs activos que tengan activada la preferencia de resumen diario
      const djsResult = await pool.query(`
        SELECT id, nombre, notific_reuniones_dia
        FROM djs
        WHERE notific_reuniones_dia = true
      `);

      for (const dj of djsResult.rows) {
        const djId = dj.id;

        // 2. Obtener eventos de este DJ para el día de hoy
        const eventsQuery = `
          SELECT 
            e.id,
            s.nombre as salon_nombre,
            c.titulo as coordinacion_titulo,
            c.tipo_evento,
            c.nombre_cliente,
            c.nombre_agasajado
          FROM eventos e
          INNER JOIN salones s ON e.salon_id = s.id
          LEFT JOIN coordinaciones c ON DATE(e.fecha_evento) = DATE(c.fecha_evento) AND e.salon_id = c.salon_id
          WHERE e.dj_id = $1 
            AND DATE(e.fecha_evento) = (timezone('America/Argentina/Buenos_Aires', NOW()))::date
            AND (c.tipo_evento IS NULL OR TRIM(LOWER(c.tipo_evento)) NOT IN ('reunión', 'reunion'))
        `;
        const eventsResult = await pool.query(eventsQuery, [djId]);
        const eventsCount = eventsResult.rows.length;

        // 3. Obtener reuniones/videollamadas de este DJ para el día de hoy
        const meetingsQuery = `
          SELECT 
            c.id,
            c.titulo,
            c.nombre_cliente,
            c.nombre_agasajado
          FROM coordinaciones c
          WHERE c.activo = true 
            AND c.dj_responsable_id = $1
            AND c.videollamada_agendada = true 
            AND c.videollamada_completada = false
            AND c.videollamada_fecha::date = (timezone('America/Argentina/Buenos_Aires', NOW()))::date
        `;
        const meetingsResult = await pool.query(meetingsQuery, [djId]);
        const meetingsCount = meetingsResult.rows.length;

        // 4. Armar la notificación según la combinación de eventos y reuniones
        let title = '📅 Tu Agenda de Hoy';
        let body = '';
        let url = '/dashboard';

        if (eventsCount > 0) {
          // Formatear los detalles del evento
          const eventDetails = eventsResult.rows.map(row => {
            const label = row.coordinacion_titulo || `${row.tipo_evento || 'Evento'} de ${row.nombre_agasajado || row.nombre_cliente || 'cliente'}`;
            return `${label} en ${row.salon_nombre}`;
          }).join(', ');

          body = `Buenos dias! Hoy tenes ${eventsCount === 1 ? 'un Evento' : `${eventsCount} Eventos`}! ${eventDetails}`;
          if (meetingsCount > 0) {
            body += `. Además, tenés ${meetingsCount} ${meetingsCount === 1 ? 'reunión agendada' : 'reuniones agendadas'}.`;
          }
          url = '/dashboard/eventos';
        } else if (meetingsCount > 0) {
          body = `Buenos dias! Hoy tenes ${meetingsCount} ${meetingsCount === 1 ? 'reunión agendada' : 'reuniones agendadas'}. Clickea aca para ver los detalles`;
          url = '/dashboard/coordinaciones';
        } else {
          title = '📅 Día Libre!';
          body = 'Buenos dias! Hoy no tenes ningún compromiso agendado! Disfruta tu dia libre!';
          url = '/dashboard';
        }

        const payload = { title, body, url };

        // Enviar la notificación
        await enviarNotificacionDJ(djId, payload, 'notific_reuniones_dia');
        report.resumenDJsNotificados.push({ djId, djNombre: dj.nombre, eventos: eventsCount, reuniones: meetingsCount });
      }
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error en Cron Worker de notificaciones:', error);
    return res.status(500).json({ error: 'Error interno en el cron worker' });
  }
}
