/**
 * Middleware de seguridad y rendimiento para API routes
 */

/**
 * Valida el tamaño del body del request
 * @param {number} maxSizeBytes - Tamaño máximo en bytes (default: 1MB)
 */
export function validateBodySize(maxSizeBytes = 1024 * 1024) {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: `Request body demasiado grande. Máximo permitido: ${maxSizeBytes / 1024}KB`,
      });
    }
    
    // En Next.js, el body ya está parseado, pero podemos validar el tamaño
    if (req.body && JSON.stringify(req.body).length > maxSizeBytes) {
      return res.status(413).json({
        error: `Request body demasiado grande. Máximo permitido: ${maxSizeBytes / 1024}KB`,
      });
    }
    
    return next ? next() : true;
  };
}

/**
 * Valida el método HTTP permitido
 * @param {string[]} allowedMethods - Métodos permitidos
 */
export function validateMethod(allowedMethods) {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: `Método ${req.method} no permitido. Métodos permitidos: ${allowedMethods.join(', ')}`,
      });
    }
    
    return next ? next() : true;
  };
}

/**
 * Agrega headers de seguridad
 */
export function securityHeaders(req, res, next) {
  // Headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS ya está manejado por Next.js/Vercel
  // Pero podemos agregar headers adicionales si es necesario
  
  return next ? next() : true;
}

/**
 * Wrapper para manejo de errores en API routes
 * @param {Function} handler - Handler de la API route
 */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      // Aplicar validaciones básicas
      validateBodySize()(req, res);
      securityHeaders(req, res);
      
      // Ejecutar handler
      await handler(req, res);
    } catch (error) {
      console.error('Error en API route:', error);
      
      // No enviar detalles del error en producción
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        error: 'Error interno del servidor',
        ...(isDevelopment && { details: error.message, stack: error.stack }),
      });
    }
  };
}

/**
 * Rate limiting simple por IP (para endpoints públicos)
 * @param {number} maxRequests - Máximo de requests
 * @param {number} windowMs - Ventana de tiempo en ms
 */
const ipRateLimitStore = new Map();

export function rateLimitByIP(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               'unknown';
    
    const key = `ratelimit:ip:${ip}`;
    const now = Date.now();
    const record = ipRateLimitStore.get(key);
    
    if (!record) {
      ipRateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next ? next() : true;
    }
    
    // Si la ventana expiró, resetear
    if (now > record.resetAt) {
      ipRateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next ? next() : true;
    }
    
    // Si excede el límite
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes desde esta IP. Por favor, espera un momento.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }
    
    // Incrementar contador
    record.count++;
    return next ? next() : true;
  };
}

// Limpiar rate limit store cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipRateLimitStore.entries()) {
      if (now > record.resetAt) {
        ipRateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

