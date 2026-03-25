/**
 * Middleware de seguridad y rendimiento para API routes
 */
import { authenticateToken } from '@/lib/auth.js';

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
 * Middleware de autorización por rol.
 * Verifica autenticación JWT + que el rol del usuario esté en la lista permitida.
 * 
 * @param {string[]} allowedRoles - Roles permitidos (ej: ['admin'], ['admin', 'dj'])
 * @returns {{ user: object } | { error: string, status: number }}
 * 
 * @example
 * // En un API route:
 * const auth = requireRole(req, ['admin']);
 * if (auth.error) {
 *   return res.status(auth.status).json({ error: auth.error });
 * }
 * // auth.user contiene { id, nombre, rol }
 */
export function requireRole(req, allowedRoles) {
  const auth = authenticateToken(req);

  if (auth.error) {
    return auth; // Propaga { error, status } de authenticateToken
  }

  if (!allowedRoles.includes(auth.user.rol)) {
    return { error: 'Acceso restringido. No tenés permisos para esta acción.', status: 403 };
  }

  return { user: auth.user };
}

/**
 * Rate limiting básico por IP usando headers de Vercel.
 * 
 * NOTA: Este rate limiter es informativo, NO es un bloqueo real en serverless.
 * Cada instancia de Vercel tiene su propia memoria — el rate limit NO se
 * comparte entre invocaciones.
 * 
 * Para rate limiting robusto en producción, usar:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Cloudflare Rate Limiting
 * 
 * Este middleware agrega headers informativos de rate limit a las respuestas
 * y provee protección básica contra ráfagas dentro de una misma instancia.
 * 
 * @param {number} maxRequests - Máximo de requests por ventana
 * @param {number} windowMs - Ventana de tiempo en ms
 */
const ipRateLimitStore = new Map();

export function rateLimitByIP(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      'unknown';

    const key = `ratelimit:ip:${ip}`;
    const now = Date.now();
    const record = ipRateLimitStore.get(key);

    // Limpiar entradas expiradas (inline, sin setInterval)
    if (ipRateLimitStore.size > 1000) {
      for (const [k, v] of ipRateLimitStore.entries()) {
        if (now > v.resetAt) ipRateLimitStore.delete(k);
      }
    }

    if (!record || now > record.resetAt) {
      ipRateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next ? next() : true;
    }

    // Si excede el límite
    if (record.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Demasiadas solicitudes desde esta IP. Por favor, espera un momento.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    // Incrementar contador
    record.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
    return next ? next() : true;
  };
}
