import twilio from 'twilio';
import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

/**
 * Endpoint para enviar mensajes de WhatsApp
 * POST /api/whatsapp/send
 */
export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { coordinacion_id, message, to_phone_number } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    // Validar credenciales de Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      return res.status(500).json({ 
        error: 'Twilio no está configurado. Verifica las variables de entorno.' 
      });
    }

    // Inicializar cliente de Twilio
    const client = twilio(accountSid, authToken);

    // Determinar número de destino
    let toNumber = to_phone_number;
    let coordinacion = null;

    if (coordinacion_id) {
      // Buscar coordinación
      coordinacion = await Coordinacion.findById(coordinacion_id);
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }

      // Verificar permisos
      if (auth.user.rol !== 'admin' && coordinacion.dj_responsable_id !== auth.user.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para enviar mensajes en esta coordinación' 
        });
      }

      // Usar teléfono de la coordinación si no se especifica otro
      if (!toNumber && coordinacion.telefono) {
        toNumber = coordinacion.telefono;
      }
    }

    if (!toNumber) {
      return res.status(400).json({ 
        error: 'Debes especificar un número de teléfono o una coordinación con teléfono' 
      });
    }

    // Normalizar número de teléfono
    let phoneNumber = toNumber.replace(/[\s\-\(\)]/g, '');
    
    // Agregar código de país si no lo tiene (asumir Argentina +54)
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('54')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '54' + phoneNumber.substring(1);
      } else {
        phoneNumber = '54' + phoneNumber;
      }
    }
    
    // Agregar prefijo "whatsapp:" para Twilio
    const whatsappToNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:+${phoneNumber.replace(/^\+/, '')}`;

    console.log('📤 Enviando mensaje de WhatsApp:', {
      from: whatsappNumber,
      to: whatsappToNumber,
      coordinacion_id,
      messageLength: message.length
    });

    // Enviar mensaje a través de Twilio
    const twilioMessage = await client.messages.create({
      from: whatsappNumber,
      to: whatsappToNumber,
      body: message
    });

    console.log('✅ Mensaje enviado:', {
      messageSid: twilioMessage.sid,
      status: twilioMessage.status
    });

    // Guardar en base de datos si hay coordinación
    if (coordinacion) {
      // Buscar o crear conversación
      const conversacion = await WhatsAppConversacion.findOrCreate(
        coordinacion.id,
        phoneNumber.replace(/^\+/, ''), // Guardar sin el +
        null
      );

      // Guardar mensaje enviado
      await WhatsAppMensaje.create({
        conversacionId: conversacion.id,
        coordinacionId: coordinacion.id,
        twilioMessageSid: twilioMessage.sid,
        fromNumber: whatsappNumber.replace('whatsapp:', ''),
        toNumber: whatsappToNumber.replace('whatsapp:', ''),
        body: message,
        direction: 'outbound',
        status: twilioMessage.status || 'sent'
      });

      // Actualizar última actividad
      await WhatsAppConversacion.updateLastActivity(
        conversacion.id,
        message.substring(0, 100),
        false // Es outbound
      );
    }

    res.status(200).json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status
    });
  } catch (error) {
    console.error('❌ Error al enviar mensaje de WhatsApp:', error);
    
    // Manejar errores específicos de Twilio
    if (error.code === 21211) {
      return res.status(400).json({ 
        error: 'Número de teléfono inválido. Verifica el formato.' 
      });
    }
    
    if (error.code === 21608) {
      return res.status(400).json({ 
        error: 'No tienes permiso para enviar a este número. Verifica que el número esté en el Sandbox.' 
      });
    }

    res.status(500).json({ 
      error: 'Error al enviar mensaje',
      message: error.message 
    });
  }
}

