import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';

/**
 * Endpoint para obtener mensajes de una conversación
 * GET /api/whatsapp/conversations/[phone]/messages
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
    const { phone } = req.query; // Next.js pasa el parámetro dinámico en req.query
    const { limit = 50, offset = 0 } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'Número de teléfono requerido' });
    }

    // Buscar conversación por número de teléfono
    // Necesitamos buscar todas las conversaciones del DJ y filtrar por teléfono
    const conversaciones = await WhatsAppConversacion.findByDjId(auth.user.id);
    const conversacion = conversaciones.find(c => 
      c.phone_number === phone || 
      c.phone_number === `+${phone}` ||
      c.phone_number === phone.replace('+', '')
    );

    if (!conversacion) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    // Obtener mensajes de la conversación
    const mensajes = await WhatsAppMensaje.findByConversacion(
      conversacion.id,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    // Marcar conversación como leída
    await WhatsAppConversacion.markAsRead(conversacion.id);

    res.json({
      conversacion,
      mensajes,
      total: mensajes.length
    });
  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
}

