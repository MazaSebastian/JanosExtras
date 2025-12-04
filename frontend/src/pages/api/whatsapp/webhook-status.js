/**
 * Webhook para recibir actualizaciones de estado de mensajes ENVIADOS desde Twilio
 * POST /api/whatsapp/webhook-status
 * 
 * Este endpoint puede recibir actualizaciones de estado tanto para mensajes enviados
 * como recibidos, y los guarda en la base de datos
 */
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const {
      MessageSid,
      MessageStatus,
      To, // Número destino
      From, // Número origen
      ErrorCode,
      ErrorMessage
    } = req.body;

    console.log('📊 Actualización de estado recibida:', {
      MessageSid,
      MessageStatus,
      To,
      From,
      ErrorCode
    });

    if (!MessageSid || !MessageStatus) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Buscar el mensaje por SID de Twilio
    let mensaje = await WhatsAppMensaje.findByTwilioSid(MessageSid);

    // Si el mensaje no existe en la BD, podría ser un mensaje enviado desde Twilio Console
    // Intentar crear el mensaje si tenemos la información necesaria
    if (!mensaje && To && From) {
      console.log('⚠️ Mensaje no encontrado en BD, intentando crear desde webhook de estado');
      
      // Normalizar números
      const normalizePhone = (phone) => {
        if (!phone) return '';
        return phone.toString().replace('whatsapp:', '').replace(/^\+/, '');
      };

      const toNumber = normalizePhone(To);
      const fromNumber = normalizePhone(From);

      // Buscar coordinación por número de destino (el cliente)
      const coordinaciones = await Coordinacion.findAll({});
      let coordinacion = null;

      for (const coord of coordinaciones) {
        if (!coord.telefono) continue;
        const normalizedCoord = normalizePhone(coord.telefono);
        if (normalizedCoord === toNumber) {
          coordinacion = coord;
          break;
        }
      }

      if (coordinacion) {
        // Crear conversación si no existe
        const conversacion = await WhatsAppConversacion.findOrCreate(
          coordinacion.id,
          toNumber,
          null
        );

        // Crear mensaje
        mensaje = await WhatsAppMensaje.create({
          conversacionId: conversacion.id,
          coordinacionId: coordinacion.id,
          twilioMessageSid: MessageSid,
          fromNumber: fromNumber,
          toNumber: toNumber,
          body: 'Mensaje enviado desde Twilio Console', // No tenemos el body en el status webhook
          direction: 'outbound',
          status: MessageStatus.toLowerCase()
        });

        console.log('✅ Mensaje creado desde webhook de estado:', mensaje.id);
      }
    }

    if (!mensaje) {
      console.warn('⚠️ Mensaje no encontrado y no se pudo crear:', MessageSid);
      return res.status(200).json({ success: true, message: 'Mensaje no encontrado' });
    }

    // Mapear estados de Twilio
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

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error al procesar status webhook:', error);
    res.status(200).json({ success: false, error: error.message });
  }
}

