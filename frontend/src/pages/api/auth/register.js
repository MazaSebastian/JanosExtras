import { DJ } from '@/lib/models/DJ.js';
import { registerSchema } from '@/utils/validation.js';
import { authenticateToken } from '@/lib/auth.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // 1. Autenticar y autorizar: solo admins pueden crear usuarios
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const user = authResult.user;
    if (user.rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado: Solo los administradores pueden crear DJs' });
    }

    // 2. Validar datos
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { nombre, password, salon_id } = parsed.data;

    // Verificar si el nombre ya existe
    const existingDJ = await DJ.findByNombre(nombre);
    if (existingDJ) {
      return res.status(400).json({ error: 'Este nombre ya está registrado' });
    }

    // Crear nuevo DJ con salón asignado
    const newDJ = await DJ.create({ nombre, password, salon_id, rol: 'dj' });

    res.status(201).json({
      message: 'DJ registrado exitosamente',
      dj: {
        id: newDJ.id,
        nombre: newDJ.nombre,
        salon_id: newDJ.salon_id,
        rol: newDJ.rol
      }
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar DJ' });
  }
}

