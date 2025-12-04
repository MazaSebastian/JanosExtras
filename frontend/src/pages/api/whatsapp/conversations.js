import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';

/**
 * Endpoint para listar conversaciones de WhatsApp
 * GET /api/whatsapp/conversations
 */
export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { unread_only } = req.query;
    
    let conversaciones;
    if (unread_only === 'true') {
      conversaciones = await WhatsAppConversacion.findUnreadByDjId(auth.user.id);
    } else {
      conversaciones = await WhatsAppConversacion.findByDjId(auth.user.id);
    }

    res.json(conversaciones);
  } catch (error) {
    console.error('❌ Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
}

