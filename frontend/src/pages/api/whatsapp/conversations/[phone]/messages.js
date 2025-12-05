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
    // En Next.js, los parámetros dinámicos están en req.query
    const phone = req.query.phone || req.query['[phone]'];
    const { limit = 50, offset = 0 } = req.query;

    console.log('📱 Obteniendo mensajes para teléfono:', {
      phone,
      queryParams: req.query,
      djId: auth.user.id
    });

    if (!phone) {
      return res.status(400).json({ error: 'Número de teléfono requerido' });
    }

    // Buscar conversación por número de teléfono
    // Necesitamos buscar todas las conversaciones del DJ y filtrar por teléfono
    const conversaciones = await WhatsAppConversacion.findByDjId(auth.user.id);
    
    console.log('🔍 Conversaciones encontradas para DJ:', {
      total: conversaciones.length,
      phones: conversaciones.map(c => c.phone_number)
    });

    // Normalizar número de teléfono para comparación
    const normalizePhone = (num) => {
      if (!num) return '';
      return num.toString().replace(/[\s\-\(\)\+]/g, '').replace('whatsapp:', '');
    };

    const normalizedPhone = normalizePhone(phone);
    const conversacion = conversaciones.find(c => {
      const normalizedConvPhone = normalizePhone(c.phone_number);
      return normalizedConvPhone === normalizedPhone;
    });

    console.log('🔍 Búsqueda de conversación:', {
      phoneBuscado: phone,
      normalizedPhone,
      conversacionEncontrada: conversacion ? {
        id: conversacion.id,
        phone_number: conversacion.phone_number,
        coordinacion_id: conversacion.coordinacion_id
      } : null
    });

    if (!conversacion) {
      console.warn('⚠️ Conversación no encontrada para teléfono:', phone);
      return res.status(404).json({ 
        error: 'Conversación no encontrada',
        phone: phone,
        availablePhones: conversaciones.map(c => c.phone_number)
      });
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

