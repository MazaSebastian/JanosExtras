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
let redisInitialized = false;

// Función para inicializar Redis de forma asíncrona y segura
// Solo se ejecuta en runtime, nunca durante el build
async function initializeRedis() {
  // Solo intentar una vez
  if (redisInitialized) {
    return;
  }
  redisInitialized = true;

  // Solo intentar si las variables de entorno están configuradas
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }

  // Solo intentar en el servidor (no en el cliente)
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    // Intentar importar dinámicamente solo en runtime (no durante build)
    // Usar require dinámico para evitar errores de build si el paquete no está instalado
    const redisModule = await Promise.resolve().then(() => {
      try {
        // Intentar importar solo si está disponible
        return require('@upstash/redis');
      } catch (e) {
        // Paquete no instalado, retornar null
        return null;
      }
    });

    if (redisModule && redisModule.Redis) {
      redisClient = new redisModule.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      useRedis = true;
      console.log('✅ Rate limiting con Redis activado');
    }
  } catch (error) {
    // Redis no disponible, usar memoria (silencioso)
    useRedis = false;
  }
}

/**
 * Verifica si un DJ puede realizar una acción (con Redis o memoria)
 * @param {number} djId - ID del DJ
 * @param {string} action - Tipo de acción ('fichada', 'evento', etc.)
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {Promise<{allowed: boolean, retryAfter?: number}>} Resultado del rate limit
 */
export async function checkRateLimit(djId, action = 'fichada', maxRequests = 5, windowMs = 60000) {
  // Intentar inicializar Redis si aún no se ha hecho
  await initializeRedis();
  
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
      const allowed = memoryRateLimit(djId, action, maxRequests, windowMs);
      return { allowed };
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
  await initializeRedis();
  
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
