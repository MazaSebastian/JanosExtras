import pool from '../database-config.js';

export class GoogleCalendarToken {
  /**
   * Guardar o actualizar token de Google Calendar para un DJ
   */
  static async upsert(dj_id, { access_token, refresh_token, expiry_date, scope, token_type = 'Bearer' }) {
    const query = `
      INSERT INTO google_calendar_tokens (dj_id, access_token, refresh_token, expiry_date, scope, token_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (dj_id) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expiry_date = EXCLUDED.expiry_date,
        scope = EXCLUDED.scope,
        token_type = EXCLUDED.token_type,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      dj_id,
      access_token,
      refresh_token,
      expiry_date,
      scope,
      token_type
    ]);
    
    return result.rows[0];
  }

  /**
   * Obtener token de un DJ
   */
  static async findByDjId(dj_id) {
    const query = 'SELECT * FROM google_calendar_tokens WHERE dj_id = $1';
    const result = await pool.query(query, [dj_id]);
    return result.rows[0] || null;
  }

  /**
   * Eliminar token de un DJ (desconectar Google Calendar)
   */
  static async deleteByDjId(dj_id) {
    const query = 'DELETE FROM google_calendar_tokens WHERE dj_id = $1 RETURNING *';
    const result = await pool.query(query, [dj_id]);
    return result.rows[0] || null;
  }

  /**
   * Verificar si un DJ tiene Google Calendar conectado
   */
  static async isConnected(dj_id) {
    const token = await this.findByDjId(dj_id);
    if (!token) return false;
    
    // Verificar si el token no ha expirado
    const now = new Date();
    const expiry = new Date(token.expiry_date);
    
    // Si expiró pero tiene refresh_token, aún está conectado
    return expiry > now || !!token.refresh_token;
  }
}

