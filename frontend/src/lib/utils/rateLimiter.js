/**
 * Rate Limiter simple en memoria para prevenir spam
 * En producción, considerar usar Redis o un servicio externo
 */

const rateLimitStore = new Map();

/**
 * Verifica si un DJ puede realizar una acción
 * @param {number} djId - ID del DJ
 * @param {string} action - Tipo de acción ('fichada')
 * @param {number} maxRequests - Máximo de requests permitidos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {boolean} true si está permitido, false si excede el límite
 */
export function checkRateLimit(djId, action = 'fichada', maxRequests = 5, windowMs = 60000) {
  const key = `${djId}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Si la ventana expiró, resetear
  if (now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Si excede el límite
  if (record.count >= maxRequests) {
    return false;
  }

  // Incrementar contador
  record.count++;
  return true;
}

/**
 * Limpia registros expirados (ejecutar periódicamente)
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpiar registros expirados cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

