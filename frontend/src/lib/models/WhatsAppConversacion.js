import db from '../database-config.js';

/**
 * Modelo para manejar conversaciones de WhatsApp
 */
export class WhatsAppConversacion {
  /**
   * Buscar o crear una conversación
   */
  static async findOrCreate(coordinacionId, phoneNumber, contactName = null) {
    const query = `
      INSERT INTO whatsapp_conversaciones (coordinacion_id, phone_number, contact_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (coordinacion_id, phone_number)
      DO UPDATE SET 
        contact_name = COALESCE(EXCLUDED.contact_name, whatsapp_conversaciones.contact_name),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await db.query(query, [coordinacionId, phoneNumber, contactName]);
    return result.rows[0];
  }

  /**
   * Obtener todas las conversaciones de un DJ
   */
  static async findByDjId(djId) {
    const query = `
      SELECT wc.*, c.nombre_cliente, c.titulo as coordinacion_titulo
      FROM whatsapp_conversaciones wc
      INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE c.dj_responsable_id = $1
      ORDER BY wc.last_message_at DESC NULLS LAST, wc.updated_at DESC
    `;
    
    const result = await db.query(query, [djId]);
    return result.rows;
  }

  /**
   * Obtener conversaciones con mensajes no leídos
   */
  static async findUnreadByDjId(djId) {
    const query = `
      SELECT wc.*, c.nombre_cliente, c.titulo as coordinacion_titulo
      FROM whatsapp_conversaciones wc
      INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE c.dj_responsable_id = $1 AND wc.unread_count > 0
      ORDER BY wc.last_message_at DESC
    `;
    
    const result = await db.query(query, [djId]);
    return result.rows;
  }

  /**
   * Obtener contador total de mensajes no leídos
   */
  static async getUnreadCount(djId) {
    const query = `
      SELECT SUM(wc.unread_count) as total
      FROM whatsapp_conversaciones wc
      INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE c.dj_responsable_id = $1
    `;
    
    const result = await db.query(query, [djId]);
    return parseInt(result.rows[0]?.total || 0, 10);
  }

  /**
   * Actualizar última actividad de una conversación
   */
  static async updateLastActivity(conversacionId, messagePreview, isInbound = false) {
    const updateUnread = isInbound ? ', unread_count = unread_count + 1' : '';
    
    const query = `
      UPDATE whatsapp_conversaciones
      SET 
        last_message_at = CURRENT_TIMESTAMP,
        last_message_preview = $2,
        updated_at = CURRENT_TIMESTAMP
        ${updateUnread}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [conversacionId, messagePreview]);
    return result.rows[0];
  }

  /**
   * Marcar conversación como leída
   */
  static async markAsRead(conversacionId) {
    const query = `
      UPDATE whatsapp_conversaciones
      SET unread_count = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [conversacionId]);
    return result.rows[0];
  }

  /**
   * Obtener conversación por ID
   */
  static async findById(id) {
    const query = `
      SELECT wc.*, c.nombre_cliente, c.titulo as coordinacion_titulo
      FROM whatsapp_conversaciones wc
      INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE wc.id = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }
}

