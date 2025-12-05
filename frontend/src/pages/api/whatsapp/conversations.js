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
    
    console.log('📋 Obteniendo conversaciones para DJ:', {
      djId: auth.user.id,
      unreadOnly: unread_only === 'true'
    });
    
    let conversaciones;
    if (unread_only === 'true') {
      conversaciones = await WhatsAppConversacion.findUnreadByDjId(auth.user.id);
    } else {
      conversaciones = await WhatsAppConversacion.findByDjId(auth.user.id);
    }

    console.log('✅ Conversaciones encontradas:', {
      count: conversaciones.length,
      conversaciones: conversaciones.map(c => ({
        id: c.id,
        coordinacion_id: c.coordinacion_id,
        phone_number: c.phone_number,
        nombre_cliente: c.nombre_cliente,
        coordinacion_titulo: c.coordinacion_titulo,
        last_message_at: c.last_message_at,
        unread_count: c.unread_count
      }))
    });

    res.json(conversaciones);
  } catch (error) {
    console.error('❌ Error al obtener conversaciones:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener conversaciones',
      details: error.message 
    });
  }
}

