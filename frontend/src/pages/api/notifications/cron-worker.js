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
        AND c.videollamada_fecha >= NOW() - INTERVAL '15 minutes'
        AND c.videollamada_fecha <= NOW() + INTERVAL '4 hours'
    `;

    const meetingsResult = await pool.query(upcomingMeetingsQuery);
    const nowMs = Date.now();

    for (const row of meetingsResult.rows) {
      const meetingTime = new Date(row.videollamada_fecha).getTime();
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

    // --- 2. RESUMEN DIARIO DE REUNIONES (A LAS 09:00 AM HORA ARGENTINA) ---
    const localTimeStr = new Date().toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const [hour, minute] = localTimeStr.split(':').map(Number);
    // Ejecutar si el cron se llama entre las 9:00 y las 9:15
    if (hour === 9 && minute >= 0 && minute < 15) {
      report.resumenDiarioEnviado = true;

      // Obtener reuniones para el día de hoy
      const dailyMeetingsQuery = `
        SELECT 
          c.id, 
          c.dj_responsable_id
        FROM coordinaciones c
        WHERE c.activo = true 
          AND c.videollamada_agendada = true 
          AND c.videollamada_completada = false
          AND c.videollamada_fecha::date = CURRENT_DATE
      `;
      const dailyResult = await pool.query(dailyMeetingsQuery);

      // Agrupar cantidad de reuniones por DJ
      const djMeetingCounts = {};
      dailyResult.rows.forEach(row => {
        if (row.dj_responsable_id) {
          djMeetingCounts[row.dj_responsable_id] = (djMeetingCounts[row.dj_responsable_id] || 0) + 1;
        }
      });

      // Enviar a cada DJ
      for (const [djId, count] of Object.entries(djMeetingCounts)) {
        const payload = {
          title: '📅 Reuniones de hoy',
          body: `Tenés ${count} reunión/es agendadas para el día de hoy.`,
          url: `/dashboard/coordinaciones`
        };

        // Enviar respetando la preferencia notific_reuniones_dia
        await enviarNotificacionDJ(Number(djId), payload, 'notific_reuniones_dia');
        report.resumenDJsNotificados.push({ djId: Number(djId), reuniones: count });
      }
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error en Cron Worker de notificaciones:', error);
    return res.status(500).json({ error: 'Error interno en el cron worker' });
  }
}
