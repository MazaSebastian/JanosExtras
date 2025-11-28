/**
 * Sistema de cache simple para datos que cambian poco
 * En producción, considerar usar Redis o Vercel Edge Cache
 */

const cache = new Map();

/**
 * Obtiene un valor del cache
 * @param {string} key - Clave del cache
 * @returns {any|null} Valor cacheado o null si no existe/expirado
 */
export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Verificar si expiró
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Guarda un valor en el cache
 * @param {string} key - Clave del cache
 * @param {any} value - Valor a cachear
 * @param {number} ttlMs - Tiempo de vida en milisegundos (default: 5 minutos)
 */
export function setCache(key, value, ttlMs = 5 * 60 * 1000) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Elimina un valor del cache
 * @param {string} key - Clave del cache
 */
export function deleteCache(key) {
  cache.delete(key);
}

/**
 * Limpia todo el cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Limpia entradas expiradas del cache
 */
export function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}

// Limpiar cache expirado cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 10 * 60 * 1000);
}

/**
 * Wrapper para funciones async con cache
 * @param {string} key - Clave del cache
 * @param {Function} fn - Función async a ejecutar si no hay cache
 * @param {number} ttlMs - Tiempo de vida del cache
 * @returns {Promise<any>} Valor cacheado o resultado de la función
 */
export async function cached(key, fn, ttlMs = 5 * 60 * 1000) {
  const cached = getCache(key);
  if (cached !== null) {
    return cached;
  }
  
  const value = await fn();
  setCache(key, value, ttlMs);
  return value;
}

