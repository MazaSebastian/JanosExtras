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
      findQuery = `
        SELECT * FROM whatsapp_conversaciones
        WHERE coordinacion_id = $1 AND phone_number = $2
      `;
      findParams = [coordinacionId, phoneNumber];
    } else {
      // Buscar por phone_number y djId (a través de coordinaciones)
      findQuery = `
        SELECT wc.* FROM whatsapp_conversaciones wc
        INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
        WHERE wc.phone_number = $1 AND c.dj_responsable_id = $2
        LIMIT 1
      `;
      findParams = [phoneNumber, djId];
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
    // Si no hay coordinación, necesitamos crear una conversación "huérfana"
    // Para esto, necesitamos modificar la tabla para permitir coordinacion_id NULL
    // Por ahora, si no hay coordinación, no podemos crear la conversación
    // Esto se manejará en el webhook
    if (!coordinacionId) {
      throw new Error('No se puede crear conversación sin coordinación. Use coordinacionId o djId.');
    }

    const insertQuery = `
      INSERT INTO whatsapp_conversaciones (coordinacion_id, phone_number, contact_name)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [coordinacionId, phoneNumber, contactName]);
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
    try {
      const query = `
        SELECT COALESCE(SUM(wc.unread_count), 0) as total
        FROM whatsapp_conversaciones wc
        INNER JOIN coordinaciones c ON wc.coordinacion_id = c.id
        WHERE c.dj_responsable_id = $1
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

