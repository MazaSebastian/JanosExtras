import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req) => {
  if (!JWT_SECRET) {
    console.error('❌ CRITICAL: JWT_SECRET no está configurado en las variables de entorno');
    return { error: 'Error de configuración del servidor', status: 500 };
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Token de acceso requerido', status: 401 };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { user };
  } catch (err) {
    return { error: 'Token inválido o expirado', status: 401 };
  }
};

