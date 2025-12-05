import twilio from 'twilio';
import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';
import { WhatsAppMensaje } from '@/lib/models/WhatsAppMensaje.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';
import db from '@/lib/database-config.js';

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

    // Normalizar número para guardar (sin + y sin whatsapp:)
    const phoneToSave = phoneNumber.replace(/^\+/, '').replace('whatsapp:', '');
    
    let conversacion;

    if (coordinacion) {
      // Caso 1: Hay coordinación
      console.log('💾 Guardando mensaje en BD con coordinación:', {
        coordinacionId: coordinacion.id,
        phoneToSave,
        messageLength: message.length
      });

      // Buscar o crear conversación
      conversacion = await WhatsAppConversacion.findOrCreate(
        coordinacion.id,
        phoneToSave,
        null
      );
    } else {
      // Caso 2: No hay coordinación, buscar conversación existente por número
      console.log('💾 Guardando mensaje sin coordinación, buscando conversación por número:', phoneToSave);
      
      const findQuery = `
        SELECT * FROM whatsapp_conversaciones
        WHERE phone_number = $1
        ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        LIMIT 1
      `;
      const existingConv = await db.query(findQuery, [phoneToSave]);

      if (existingConv.rows.length > 0) {
        conversacion = existingConv.rows[0];
        
        // Si la conversación no tiene dj_id, "reclamarla" asignándola al DJ que responde
        if (!conversacion.dj_id) {
          console.log('🔐 Reclamando conversación sin DJ asignado para DJ:', auth.user.id);
          const updateQuery = `
            UPDATE whatsapp_conversaciones
            SET dj_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
          `;
          const updated = await db.query(updateQuery, [auth.user.id, conversacion.id]);
          conversacion = updated.rows[0];
        }
      } else {
        // No hay conversación previa, crear una nueva asignada al DJ que envía
        console.log('📝 Creando nueva conversación sin coordinación para DJ:', auth.user.id);
        const insertQuery = `
          INSERT INTO whatsapp_conversaciones (phone_number, contact_name, coordinacion_id, dj_id)
          VALUES ($1, $2, NULL, $3)
          RETURNING *
        `;
        const newConv = await db.query(insertQuery, [phoneToSave, null, auth.user.id]);
        conversacion = newConv.rows[0];
      }
    }

    console.log('✅ Conversación encontrada/creada:', {
      conversacionId: conversacion.id,
      phoneNumber: conversacion.phone_number,
      coordinacionId: conversacion.coordinacion_id,
      djId: conversacion.dj_id
    });

    // Guardar mensaje enviado
    const mensajeGuardado = await WhatsAppMensaje.create({
      conversacionId: conversacion.id,
      coordinacionId: coordinacion?.id || null,
      twilioMessageSid: twilioMessage.sid,
      fromNumber: whatsappNumber.replace('whatsapp:', '').replace(/^\+/, ''),
      toNumber: whatsappToNumber.replace('whatsapp:', '').replace(/^\+/, ''),
      body: message,
      direction: 'outbound',
      status: twilioMessage.status || 'sent'
    });

    console.log('✅ Mensaje guardado en BD:', {
      mensajeId: mensajeGuardado.id,
      conversacionId: conversacion.id
    });

    // Actualizar última actividad
    await WhatsAppConversacion.updateLastActivity(
      conversacion.id,
      message.substring(0, 100),
      false // Es outbound
    );

    console.log('✅ Conversación actualizada:', {
      conversacionId: conversacion.id,
      coordinacionId: coordinacion?.id || null,
      djId: conversacion.dj_id,
      phoneNumber: phoneToSave
    });

    res.status(200).json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      conversacionId: coordinacion ? conversacion?.id : null
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

