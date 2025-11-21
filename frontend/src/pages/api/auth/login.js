import jwt from 'jsonwebtoken';
import { DJ } from '@/lib/models/DJ.js';
import { loginSchema } from '@/utils/validation.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { nombre, password } = parsed.data;

    // Buscar DJ por nombre
    const dj = await DJ.findByNombre(nombre);
    if (!dj) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await DJ.comparePassword(password, dj.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: dj.id, nombre: dj.nombre, rol: dj.rol },
      process.env.JWT_SECRET || 'sistema_djs_secreto_jwt_cambiar_en_produccion_12345',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      dj: {
        id: dj.id,
        nombre: dj.nombre,
        salon_id: dj.salon_id,
        rol: dj.rol
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

