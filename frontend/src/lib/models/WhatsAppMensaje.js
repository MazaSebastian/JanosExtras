import db from '../database-config.js';

/**
 * Modelo para manejar mensajes de WhatsApp
 */
export class WhatsAppMensaje {
  /**
   * Crear un nuevo mensaje
   */
  static async create({
    conversacionId,
    coordinacionId,
    twilioMessageSid,
    fromNumber,
    toNumber,
    body,
    direction,
    status = 'sent',
    mediaUrl = null
  }) {
    const query = `
      INSERT INTO whatsapp_mensajes (
        conversacion_id, coordinacion_id, twilio_message_sid,
        from_number, to_number, body, direction, status, media_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      conversacionId,
      coordinacionId,
      twilioMessageSid,
      fromNumber,
      toNumber,
      body,
      direction,
      status,
      mediaUrl
    ]);
    
    return result.rows[0];
  }

  /**
   * Obtener mensajes de una conversación
   */
  static async findByConversacion(conversacionId, limit = 50, offset = 0) {
    const query = `
      SELECT *
      FROM whatsapp_mensajes
      WHERE conversacion_id = $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [conversacionId, limit, offset]);
    return result.rows.reverse(); // Invertir para mostrar del más antiguo al más reciente
  }

  /**
   * Obtener mensajes de una coordinación
   */
  static async findByCoordinacion(coordinacionId, limit = 50) {
    const query = `
      SELECT wm.*, wc.phone_number
      FROM whatsapp_mensajes wm
      INNER JOIN whatsapp_conversaciones wc ON wm.conversacion_id = wc.id
      WHERE wm.coordinacion_id = $1
      ORDER BY wm.sent_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(query, [coordinacionId, limit]);
    return result.rows.reverse();
  }

  /**
   * Actualizar estado de un mensaje
   */
  static async updateStatus(twilioMessageSid, status, deliveredAt = null, readAt = null) {
    const updates = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [twilioMessageSid, status];
    
    if (deliveredAt) {
      updates.push('delivered_at = $3');
      params.push(deliveredAt);
    }
    
    if (readAt) {
      updates.push('read_at = $4');
      params.push(readAt);
    }
    
    const query = `
      UPDATE whatsapp_mensajes
      SET ${updates.join(', ')}
      WHERE twilio_message_sid = $1
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    return result.rows[0];
  }

  /**
   * Buscar mensaje por SID de Twilio
   */
  static async findByTwilioSid(twilioMessageSid) {
    const query = `
      SELECT *
      FROM whatsapp_mensajes
      WHERE twilio_message_sid = $1
    `;
    
    const result = await db.query(query, [twilioMessageSid]);
    return result.rows[0] || null;
  }
}

