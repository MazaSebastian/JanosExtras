import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';

/**
 * Endpoint para obtener el contador de mensajes no leídos
 * GET /api/whatsapp/unread-count
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
    const count = await WhatsAppConversacion.getUnreadCount(auth.user.id);
    
    res.json({ count });
  } catch (error) {
    console.error('❌ Error al obtener contador de no leídos:', error);
    res.status(500).json({ error: 'Error al obtener contador' });
  }
}

