import db from '../database-config.js';

/**
 * Modelo para manejar conversaciones de WhatsApp
 */
export class WhatsAppConversacion {
  /**
   * Buscar o crear una conversación
   * @param {number|null} coordinacionId - ID de coordinación (puede ser null)
   * @param {string} phoneNumber - Número de teléfono
   * @param {string|null} contactName - Nombre del contacto
   * @param {number|null} djId - ID del DJ (requerido si coordinacionId es null)
   */
  static async findOrCreate(coordinacionId, phoneNumber, contactName = null, djId = null) {
    // Si no hay coordinación, necesitamos djId para asociar la conversación
    if (!coordinacionId && !djId) {
      throw new Error('Se requiere coordinacionId o djId para crear una conversación');
    }

    // Primero intentar buscar conversación existente
    let findQuery;
    let findParams;
    
    if (coordinacionId) {
      // Buscar por coordinación y teléfono
      findQuery = `
        SELECT * FROM whatsapp_conversaciones
        WHERE coordinacion_id = $1 AND phone_number = $2
      `;
      findParams = [coordinacionId, phoneNumber];
    } else {
      // Buscar conversación sin coordinación por dj_id y teléfono
      findQuery = `
        SELECT * FROM whatsapp_conversaciones
        WHERE coordinacion_id IS NULL AND dj_id = $1 AND phone_number = $2
      `;
      findParams = [djId, phoneNumber];
    }

    const findResult = await db.query(findQuery, findParams);
    
    if (findResult.rows.length > 0) {
      // Actualizar nombre de contacto si se proporciona
      if (contactName) {
        const updateQuery = `
          UPDATE whatsapp_conversaciones
          SET contact_name = COALESCE($1, contact_name),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        const updateResult = await db.query(updateQuery, [contactName, findResult.rows[0].id]);
        return updateResult.rows[0];
      }
      return findResult.rows[0];
    }

    // Si no existe, crear nueva conversación
    const insertQuery = coordinacionId
      ? `INSERT INTO whatsapp_conversaciones (coordinacion_id, phone_number, contact_name)
         VALUES ($1, $2, $3)
         RETURNING *`
      : `INSERT INTO whatsapp_conversaciones (dj_id, phone_number, contact_name, coordinacion_id)
         VALUES ($1, $2, $3, NULL)
         RETURNING *`;
    
    const insertParams = coordinacionId
      ? [coordinacionId, phoneNumber, contactName]
      : [djId, phoneNumber, contactName];
    
    const result = await db.query(insertQuery, insertParams);
    return result.rows[0];
  }

  /**
   * Obtener todas las conversaciones de un DJ
   * Incluye conversaciones con coordinación Y sin coordinación (solo del DJ específico)
   */
  static async findByDjId(djId) {
    const query = `
      SELECT 
        wc.*, 
        c.nombre_cliente, 
        c.titulo as coordinacion_titulo
      FROM whatsapp_conversaciones wc
      LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE 
        (c.dj_responsable_id = $1 OR (wc.coordinacion_id IS NULL AND wc.dj_id = $1))
      ORDER BY wc.last_message_at DESC NULLS LAST, wc.updated_at DESC
    `;
    
    const result = await db.query(query, [djId]);
    return result.rows;
  }

  /**
   * Obtener conversaciones con mensajes no leídos
   * Incluye conversaciones con coordinación Y sin coordinación (solo del DJ específico)
   */
  static async findUnreadByDjId(djId) {
    const query = `
      SELECT 
        wc.*, 
        c.nombre_cliente, 
        c.titulo as coordinacion_titulo
      FROM whatsapp_conversaciones wc
      LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
      WHERE 
        (c.dj_responsable_id = $1 OR (wc.coordinacion_id IS NULL AND wc.dj_id = $1))
        AND wc.unread_count > 0
      ORDER BY wc.last_message_at DESC
    `;
    
    const result = await db.query(query, [djId]);
    return result.rows;
  }

  /**
   * Obtener contador total de mensajes no leídos
   * Incluye conversaciones con coordinación Y sin coordinación (solo del DJ específico)
   */
  static async getUnreadCount(djId) {
    try {
      const query = `
        SELECT COALESCE(SUM(wc.unread_count), 0) as total
        FROM whatsapp_conversaciones wc
        LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
        WHERE 
          (c.dj_responsable_id = $1 OR (wc.coordinacion_id IS NULL AND wc.dj_id = $1))
      `;
      
      console.log('🔍 Ejecutando query para contador de no leídos:', {
        djId,
        query: query.substring(0, 100) + '...'
      });

      const result = await db.query(query, [djId]);
      
      const count = parseInt(result.rows[0]?.total || 0, 10);
      
      console.log('✅ Contador calculado:', count);
      
      return count;
    } catch (error) {
      console.error('❌ Error en getUnreadCount:', error);
      // En caso de error, retornar 0 en lugar de lanzar excepción
      return 0;
    }
  }

  /**
   * Actualizar última actividad de una conversación
   */
  static async updateLastActivity(conversacionId, messagePreview, isInbound = false) {
    const updateUnread = isInbound ? ', unread_count = COALESCE(unread_count, 0) + 1' : '';
    
    console.log('📝 Actualizando última actividad:', {
      conversacionId,
      isInbound,
      willIncrementUnread: isInbound,
      messagePreview: messagePreview?.substring(0, 50)
    });
    
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
    
    console.log('✅ Última actividad actualizada:', {
      conversacionId,
      unreadCount: result.rows[0]?.unread_count,
      lastMessageAt: result.rows[0]?.last_message_at
    });
    
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

