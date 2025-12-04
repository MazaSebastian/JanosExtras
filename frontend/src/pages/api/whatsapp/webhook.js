import twilio from 'twilio';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

/**
 * Webhook para recibir mensajes de WhatsApp desde Twilio
 * POST /api/whatsapp/webhook
 * 
 * Este endpoint es llamado por Twilio cuando llega un mensaje de WhatsApp
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Twilio envía los datos como form-urlencoded
    const {
      MessageSid,
      From, // Número que envía (cliente)
      To, // Número que recibe (nuestro número de Twilio)
      Body,
      NumMedia,
      MediaUrl0,
      ProfileName
    } = req.body;

    console.log('📨 Mensaje recibido de WhatsApp:', {
      MessageSid,
      From,
      To,
      Body: Body?.substring(0, 50),
      NumMedia,
      ProfileName
    });

    // Validar que tenemos los datos necesarios
    if (!MessageSid || !From || !Body) {
      console.warn('⚠️ Mensaje incompleto recibido:', req.body);
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Limpiar el número (quitar "whatsapp:" si está presente)
    const fromNumber = From.replace('whatsapp:', '');
    const toNumber = To.replace('whatsapp:', '');

    // Buscar coordinación por número de teléfono
    // El formato puede variar, intentar diferentes formatos
    const coordinaciones = await Coordinacion.findAll({});
    let coordinacion = null;

    // Buscar coordinación que coincida con el número
    for (const coord of coordinaciones) {
      if (!coord.telefono) continue;
      
      // Limpiar y normalizar números para comparar
      const coordPhone = coord.telefono.replace(/[\s\-\(\)]/g, '');
      const fromPhone = fromNumber.replace(/[\s\-\(\)]/g, '');
      
      // Comparar sin código de país o con código
      if (coordPhone === fromPhone || 
          coordPhone === fromPhone.substring(2) || 
          coordPhone === `54${fromPhone.substring(2)}` ||
          `54${coordPhone}` === fromPhone) {
        coordinacion = coord;
        break;
      }
    }

    // Si no encontramos coordinación, crear una conversación genérica
    // O podríamos devolver un error, dependiendo del caso de uso
    if (!coordinacion) {
      console.warn('⚠️ No se encontró coordinación para el número:', fromNumber);
      // Por ahora, responder con un mensaje genérico
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Hola! No encontramos una coordinación asociada a este número. Por favor, contacta con tu DJ directamente.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Buscar o crear conversación
    const conversacion = await WhatsAppConversacion.findOrCreate(
      coordinacion.id,
      fromNumber,
      ProfileName || null
    );

    // Guardar mensaje recibido
    const mediaUrl = NumMedia > 0 ? MediaUrl0 : null;
    const mensaje = await WhatsAppMensaje.create({
      conversacionId: conversacion.id,
      coordinacionId: coordinacion.id,
      twilioMessageSid: MessageSid,
      fromNumber: fromNumber,
      toNumber: toNumber,
      body: Body,
      direction: 'inbound',
      status: 'delivered',
      mediaUrl: mediaUrl
    });

    // Actualizar última actividad de la conversación
    await WhatsAppConversacion.updateLastActivity(
      conversacion.id,
      Body.substring(0, 100), // Preview de 100 caracteres
      true // Es inbound
    );

    console.log('✅ Mensaje guardado:', {
      mensajeId: mensaje.id,
      coordinacionId: coordinacion.id,
      conversacionId: conversacion.id
    });

    // Responder a Twilio con TwiML (opcional)
    // Por ahora, solo confirmamos recepción
    const twiml = new twilio.twiml.MessagingResponse();
    // Podríamos enviar una respuesta automática aquí si es necesario
    // twiml.message('Mensaje recibido. Te responderemos pronto.');
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('❌ Error al procesar webhook de WhatsApp:', error);
    // Aún así responder a Twilio para evitar reintentos
    const twiml = new twilio.twiml.MessagingResponse();
    res.type('text/xml');
    res.send(twiml.toString());
  }
}

