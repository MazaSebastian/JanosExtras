/**
 * Utilidad para reintentos con exponential backoff
 */

/**
 * Ejecuta una función con reintentos automáticos
 * @param {Function} fn - Función a ejecutar (debe retornar una Promise)
 * @param {Object} options - Opciones de reintento
 * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} options.initialDelay - Delay inicial en ms (default: 100)
 * @param {number} options.maxDelay - Delay máximo en ms (default: 2000)
 * @param {Function} options.shouldRetry - Función que determina si se debe reintentar (default: retry on any error)
 * @returns {Promise} Resultado de la función
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 2000,
    shouldRetry = () => true,
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si no debemos reintentar o es el último intento, lanzar error
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      // Esperar antes del siguiente intento (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Determina si un error es recuperable (debe reintentarse)
 */
export function isRetryableError(error) {
  // Errores de conexión, timeout, o errores transitorios
  const retryableMessages = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'timeout',
    'connection',
    'temporary',
    '503',
    '502',
    '504',
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';

  return retryableMessages.some(
    (msg) => errorMessage.includes(msg) || errorCode.includes(msg)
  );
}

