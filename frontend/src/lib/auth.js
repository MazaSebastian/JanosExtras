import jwt from 'jsonwebtoken';

export const authenticateToken = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Token de acceso requerido', status: 401 };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'sistema_djs_secreto_jwt_cambiar_en_produccion_12345');
    return { user };
  } catch (err) {
    return { error: 'Token inválido o expirado', status: 401 };
  }
};

