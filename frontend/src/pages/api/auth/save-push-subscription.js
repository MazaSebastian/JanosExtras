import pool from '@/lib/database-config.js';
import { requireRole } from '@/lib/middleware/security.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = requireRole(req, ['admin', 'dj']);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const djId = auth.user.id;
  const { subscription, dispositivo } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Faltan parámetros de suscripción requeridos' });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth: subscriptionAuth } = keys;

  try {
    // Upsert subscription using endpoint as unique key
    const query = `
      INSERT INTO push_subscriptions (dj_id, endpoint, p256dh, auth, dispositivo, fecha_registro)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (endpoint)
      DO UPDATE SET
        dj_id = EXCLUDED.dj_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        dispositivo = EXCLUDED.dispositivo,
        fecha_registro = NOW()
      RETURNING id;
    `;

    const result = await pool.query(query, [
      djId,
      endpoint,
      p256dh,
      subscriptionAuth,
      dispositivo || null
    ]);

    return res.status(200).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error al guardar suscripción push:', error);
    return res.status(500).json({ error: 'Error interno al procesar la suscripción' });
  }
}
