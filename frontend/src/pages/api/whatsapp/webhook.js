import twilio from 'twilio';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';
import db from '@/lib/database-config.js';

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
    const fromNumber = From.replace('whatsapp:', '').replace(/^\+/, ''); // Quitar whatsapp: y +
    const toNumber = To.replace('whatsapp:', '').replace(/^\+/, '');

    console.log('🔍 Buscando coordinación para número:', {
      fromNumber,
      toNumber,
      fromOriginal: From,
      toOriginal: To
    });

    // Buscar coordinación por número de teléfono
    // El formato puede variar, intentar diferentes formatos
    const coordinaciones = await Coordinacion.findAll({});
    let coordinacion = null;

    // Función para normalizar números para comparación
    const normalizePhone = (phone) => {
      if (!phone) return '';
      // Quitar espacios, guiones, paréntesis, y el prefijo whatsapp:
      let normalized = phone.toString().replace(/[\s\-\(\)]/g, '').replace('whatsapp:', '').replace(/^\+/, '');
      // Si empieza con 0, quitarlo
      if (normalized.startsWith('0')) {
        normalized = normalized.substring(1);
      }
      // Si no empieza con 54 (Argentina), agregarlo
      if (!normalized.startsWith('54') && normalized.length > 0) {
        normalized = '54' + normalized;
      }
      return normalized;
    };

    const normalizedFrom = normalizePhone(fromNumber);

    // Buscar coordinación que coincida con el número
    for (const coord of coordinaciones) {
      if (!coord.telefono) continue;
      
      const normalizedCoord = normalizePhone(coord.telefono);
      
      console.log('🔍 Comparando:', {
        coordId: coord.id,
        coordPhone: coord.telefono,
        normalizedCoord,
        normalizedFrom,
        match: normalizedCoord === normalizedFrom
      });
      
      // Comparar números normalizados
      if (normalizedCoord === normalizedFrom) {
        coordinacion = coord;
        console.log('✅ Coordinación encontrada:', coord.id);
        break;
      }
    }

    // Guardar número sin el prefijo + para consistencia
    const phoneToSave = fromNumber.replace(/^\+/, '');

    let conversacion;
    let djIdParaGuardar = null;

    if (coordinacion) {
      // Caso 1: Hay coordinación asociada
      console.log('✅ Coordinación encontrada:', coordinacion.id);
      djIdParaGuardar = coordinacion.dj_responsable_id;
      
      conversacion = await WhatsAppConversacion.findOrCreate(
        coordinacion.id,
        phoneToSave,
        ProfileName || null
      );
    } else {
      // Caso 2: No hay coordinación, buscar si hay conversación previa con este número
      console.warn('⚠️ No se encontró coordinación para el número:', {
        fromNumber,
        normalizedFrom,
        totalCoordinaciones: coordinaciones.length
      });

      // Buscar conversación existente sin coordinación con este número
      const findQuery = `
        SELECT * FROM whatsapp_conversaciones
        WHERE coordinacion_id IS NULL AND phone_number = $1
        ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `;
      const existingConv = await db.query(findQuery, [phoneToSave]);

      if (existingConv.rows.length > 0) {
        // Hay conversación previa, usar el dj_id de esa conversación
        djIdParaGuardar = existingConv.rows[0].dj_id;
        conversacion = existingConv.rows[0];
        console.log('✅ Conversación sin coordinación encontrada, usando DJ:', djIdParaGuardar);
      } else {
        // No hay conversación previa, crear una nueva sin dj_id
        // Esto permitirá que TODOS los DJs vean la conversación
        // El primer DJ que responda "reclamará" la conversación
        console.log('📝 Creando nueva conversación sin coordinación ni DJ asignado');
        
        const insertQuery = `
          INSERT INTO whatsapp_conversaciones (phone_number, contact_name, coordinacion_id, dj_id)
          VALUES ($1, $2, NULL, NULL)
          RETURNING *
        `;
        const newConv = await db.query(insertQuery, [phoneToSave, ProfileName || null]);
        conversacion = newConv.rows[0];
        console.log('✅ Conversación sin coordinación creada:', conversacion.id);
      }
    }

    // Guardar mensaje recibido
    const mediaUrl = NumMedia > 0 ? MediaUrl0 : null;
    const mensaje = await WhatsAppMensaje.create({
      conversacionId: conversacion.id,
      coordinacionId: coordinacion?.id || null,
      twilioMessageSid: MessageSid,
      fromNumber: phoneToSave,
      toNumber: toNumber.replace(/^\+/, ''),
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

    console.log('✅ Mensaje guardado exitosamente:', {
      mensajeId: mensaje.id,
      coordinacionId: coordinacion?.id || null,
      conversacionId: conversacion.id,
      fromNumber: phoneToSave,
      bodyPreview: Body.substring(0, 50),
      sinCoordinacion: !coordinacion
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

