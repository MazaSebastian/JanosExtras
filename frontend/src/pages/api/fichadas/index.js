import { authenticateToken } from '@/lib/auth.js';
import { Fichada } from '@/lib/models/Fichada.js';
import { checkRateLimit } from '@/lib/utils/rateLimiterRedis.js';

const allowedTipos = ['ingreso', 'egreso'];

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const dj_id = auth.user.id;

  if (req.method === 'POST') {
    // Rate limiting: máximo 5 fichadas por minuto por DJ
    const rateLimitResult = await checkRateLimit(dj_id, 'fichada', 5, 60000);
    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.retryAfter || 60;
      return res.status(429).json({ 
        error: 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar nuevamente.',
        retryAfter 
      });
    }

    try {
      const { tipo, comentario, latitud, longitud } = req.body || {};
      if (!allowedTipos.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de fichada inválido.' });
      }

      const fichada = await Fichada.create({
        dj_id,
        tipo,
        comentario,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
      });
      return res.status(201).json(fichada);
    } catch (error) {
      console.error('Error al registrar fichada:', error);
      return res
        .status(400)
        .json({ error: error.message || 'No se pudo registrar la fichada.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { from, to, limit } = req.query;
      const fichadas = await Fichada.findByDJ(dj_id, {
        from: from || undefined,
        to: to || undefined,
        limit: limit ? parseInt(limit, 10) : 50,
      });
      return res.json(fichadas);
    } catch (error) {
      console.error('Error al obtener fichadas:', error);
      return res.status(500).json({ error: 'Error al obtener fichadas.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}


