/**
 * Rate Limiter mejorado con soporte para Redis (Upstash)
 * Fallback a memoria si Redis no está disponible
 * 
 * Para usar Redis en Vercel:
 * 1. Crear cuenta en Upstash (https://upstash.com)
 * 2. Crear base de datos Redis
 * 3. Agregar variables de entorno:
 *    - UPSTASH_REDIS_REST_URL
 *    - UPSTASH_REDIS_REST_TOKEN
 * 4. Instalar: npm install @upstash/redis
 */

// Fallback a rate limiting en memoria
import { checkRateLimit as memoryRateLimit } from './rateLimiter.js';

let redisClient = null;
let useRedis = false;

// Intentar inicializar Redis si está disponible
try {
  // Solo importar si las variables de entorno están configuradas
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Dynamic import para evitar errores si el paquete no está instalado
    import('@upstash/redis').then(({ Redis }) => {
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      useRedis = true;
      console.log('✅ Rate limiting con Redis activado');
    }).catch(() => {
      console.log('⚠️  Redis no disponible, usando rate limiting en memoria');
    });
  }
} catch (error) {
  // Redis no disponible, usar memoria
  console.log('⚠️  Redis no configurado, usando rate limiting en memoria');
}

/**
 * Verifica si un DJ puede realizar una acción (con Redis o memoria)
 * @param {number} djId - ID del DJ
 * @param {string} action - Tipo de acción ('fichada', 'evento', etc.)
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {Promise<boolean>} true si está permitido, false si excede el límite
 */
export async function checkRateLimit(djId, action = 'fichada', maxRequests = 5, windowMs = 60000) {
  // Si Redis está disponible, usarlo
  if (useRedis && redisClient) {
    try {
      const key = `ratelimit:${djId}:${action}`;
      
      // Obtener contador actual
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;
      
      // Si excede el límite
      if (count >= maxRequests) {
        // Obtener TTL para saber cuánto tiempo falta
        const ttl = await redisClient.ttl(key);
        return { allowed: false, retryAfter: ttl };
      }
      
      // Incrementar contador
      if (count === 0) {
        // Primera vez, establecer con TTL
        await redisClient.set(key, '1', { ex: Math.ceil(windowMs / 1000) });
      } else {
        // Incrementar
        await redisClient.incr(key);
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error en rate limiting con Redis:', error);
      // Fallback a memoria en caso de error
      return { allowed: memoryRateLimit(djId, action, maxRequests, windowMs) };
    }
  }
  
  // Fallback a memoria
  const allowed = memoryRateLimit(djId, action, maxRequests, windowMs);
  return { allowed };
}

/**
 * Limpia el rate limit para un DJ (útil para testing o reset manual)
 * @param {number} djId - ID del DJ
 * @param {string} action - Tipo de acción
 */
export async function resetRateLimit(djId, action = 'fichada') {
  if (useRedis && redisClient) {
    try {
      const key = `ratelimit:${djId}:${action}`;
      await redisClient.del(key);
    } catch (error) {
      console.error('Error al resetear rate limit:', error);
    }
  }
  // En memoria, el cleanup se hace automáticamente
}

