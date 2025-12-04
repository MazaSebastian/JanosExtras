/**
 * Webhook para recibir actualizaciones de estado de mensajes de WhatsApp desde Twilio
 * POST /api/whatsapp/status
 * 
 * Este endpoint es llamado por Twilio cuando cambia el estado de un mensaje
 * (sent, delivered, read, failed)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      MessageSid,
      MessageStatus, // sent, delivered, read, failed, etc.
      ErrorCode,
      ErrorMessage
    } = req.body;

    console.log('📊 Actualización de estado de mensaje:', {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage
    });

    if (!MessageSid || !MessageStatus) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Buscar el mensaje por SID de Twilio
    const { WhatsAppMensaje } = await import('@/lib/models/WhatsAppMensaje.js');
    const mensaje = await WhatsAppMensaje.findByTwilioSid(MessageSid);

    if (!mensaje) {
      console.warn('⚠️ Mensaje no encontrado para SID:', MessageSid);
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    // Mapear estados de Twilio a nuestros estados
    let status = MessageStatus.toLowerCase();
    const statusMap = {
      'queued': 'sent',
      'sending': 'sent',
      'sent': 'sent',
      'delivered': 'delivered',
      'undelivered': 'failed',
      'failed': 'failed',
      'read': 'read'
    };
    status = statusMap[status] || status;

    // Actualizar estado del mensaje
    const deliveredAt = status === 'delivered' || status === 'read' ? new Date() : null;
    const readAt = status === 'read' ? new Date() : null;

    await WhatsAppMensaje.updateStatus(MessageSid, status, deliveredAt, readAt);

    console.log('✅ Estado actualizado:', {
      mensajeId: mensaje.id,
      nuevoEstado: status
    });

    // Responder 200 OK a Twilio
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error al procesar status webhook:', error);
    // Responder 200 para evitar reintentos de Twilio
    res.status(200).json({ success: false, error: error.message });
  }
}

