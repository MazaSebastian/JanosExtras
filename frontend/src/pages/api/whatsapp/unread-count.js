import { authenticateToken } from '@/lib/auth.js';
import { WhatsAppConversacion } from '@/lib/models/WhatsAppConversacion.js';

/**
 * Endpoint para obtener el contador de mensajes no leídos
 * GET /api/whatsapp/unread-count
 */
export default async function handler(req, res) {
  // Configurar timeout para la respuesta (Vercel tiene límite de 10s en Hobby, 60s en Pro)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error('⏱️ Timeout en /api/whatsapp/unread-count');
      res.status(504).json({ error: 'Timeout al obtener contador', count: 0 });
    }
  }, 8000); // 8 segundos de timeout

  try {
    const auth = authenticateToken(req);
    if (auth.error) {
      clearTimeout(timeout);
      return res.status(auth.status).json({ error: auth.error });
    }

    if (req.method !== 'GET') {
      clearTimeout(timeout);
      return res.status(405).json({ error: 'Método no permitido' });
    }

    console.log('📊 Obteniendo contador de no leídos para DJ:', auth.user.id);

    const count = await WhatsAppConversacion.getUnreadCount(auth.user.id);
    
    console.log('✅ Contador de no leídos obtenido:', count);

    clearTimeout(timeout);
    res.json({ count });
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ Error al obtener contador de no leídos:', error);
    console.error('Stack trace:', error.stack);
    
    // En caso de error, devolver 0 en lugar de error para que el frontend no se rompa
    if (!res.headersSent) {
      res.status(200).json({ count: 0, error: error.message });
    }
  }
}

