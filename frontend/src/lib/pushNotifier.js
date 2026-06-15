import webpush from 'web-push';
import pool from './database-config.js';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:soporte@janos.com.ar',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn('VAPID keys not configured. Web Push notifications will not be sent.');
}

/**
 * Envia una notificación push a un DJ/Admin específico si tiene habilitada la preferencia correspondiente.
 * 
 * @param {number} djId - ID del DJ
 * @param {object} payload - Objeto con title, body, url
 * @param {string} preferenceColumn - Nombre de la columna de preferencia (opcional)
 */
export async function enviarNotificacionDJ(djId, payload, preferenceColumn = null) {
  try {
    // 1. Verificar preferencias si se especifica una columna
    if (preferenceColumn) {
      const djSettingsResult = await pool.query(
        `SELECT ${preferenceColumn} FROM djs WHERE id = $1`,
        [djId]
      );
      if (djSettingsResult.rows.length === 0) return;
      const hasPreference = djSettingsResult.rows[0][preferenceColumn];
      // Si la preferencia está desactivada explícitamente (es false), salimos
      if (hasPreference === false) {
        console.log(`Notificación push cancelada para DJ ${djId} debido a preferencia ${preferenceColumn} = false.`);
        return;
      }
    }

    // 2. Obtener suscripciones activas de este DJ
    const subsResult = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE dj_id = $1',
      [djId]
    );

    const subscriptions = subsResult.rows;
    if (subscriptions.length === 0) {
      return;
    }

    console.log(`Despachando notificaciones push a ${subscriptions.length} dispositivo(s) del DJ ${djId}`);

    // 3. Enviar notificación a cada dispositivo
    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (err) {
        // Si la suscripción expiró o ya no es válida (410 o 404), la eliminamos
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Eliminando suscripción push inactiva para el endpoint: ${sub.endpoint}`);
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        } else {
          console.error(`Error al enviar push a endpoint: ${sub.endpoint}`, err);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`Error en enviarNotificacionDJ para dj_id ${djId}:`, error);
  }
}

/**
 * Envia notificaciones de pre-coordinación completada al DJ responsable del evento y a todos los administradores.
 */
export async function enviarNotificacionPrecoordinacion(coordinacionId) {
  try {
    // Obtener detalles de la coordinación
    const query = `
      SELECT 
        c.id, 
        c.titulo, 
        c.nombre_cliente, 
        c.nombre_agasajado, 
        c.tipo_evento,
        c.fecha_evento,
        c.dj_responsable_id,
        s.nombre AS salon_nombre
      FROM coordinaciones c
      LEFT JOIN salones s ON c.salon_id = s.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [coordinacionId]);
    if (result.rows.length === 0) return;

    const coord = result.rows[0];
    const agasajadoNombre = coord.nombre_agasajado || coord.nombre_cliente || 'El cliente';
    const tipoEvento = coord.tipo_evento || 'N/A';
    
    // Formatear la fecha
    let fechaFormateada = '';
    if (coord.fecha_evento) {
      try {
        const d = new Date(coord.fecha_evento);
        if (typeof coord.fecha_evento === 'string' && coord.fecha_evento.includes('-')) {
          const parts = coord.fecha_evento.split('T')[0].split('-');
          if (parts.length === 3) {
            fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }
        if (!fechaFormateada && !isNaN(d.getTime())) {
          const dia = String(d.getUTCDate()).padStart(2, '0');
          const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
          const anio = d.getUTCFullYear();
          fechaFormateada = `${dia}/${mes}/${anio}`;
        }
      } catch (e) {
        console.error('Error al formatear fecha:', e);
      }
    }

    const bodyText = fechaFormateada 
      ? `${agasajadoNombre} ha completado la pre-coordinación del evento ${tipoEvento} y ${fechaFormateada}!`
      : `${agasajadoNombre} ha completado la pre-coordinación del evento ${tipoEvento}!`;

    const payload = {
      title: '¡Pre-coordinación completada!',
      body: bodyText,
      url: `/dashboard/coordinaciones?coordinacionId=${coord.id}`
    };

    const recipients = new Set();

    // 1. Agregar el DJ responsable si está configurado
    if (coord.dj_responsable_id) {
      recipients.add(coord.dj_responsable_id);
    }

    // 2. Obtener todos los administradores del sistema y agregarlos
    const adminsResult = await pool.query(
      "SELECT id FROM djs WHERE rol = 'admin'"
    );
    adminsResult.rows.forEach(admin => recipients.add(admin.id));

    // 3. Enviar notificaciones en paralelo
    const promises = Array.from(recipients).map(djId => 
      enviarNotificacionDJ(djId, payload, 'notific_precoordinacion_completada')
    );

    await Promise.all(promises);
  } catch (err) {
    console.error('Error al enviar notificaciones de pre-coordinación:', err);
  }
}
