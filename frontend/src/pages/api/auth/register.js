import { DJ } from '@/lib/models/DJ.js';
import { registerSchema } from '@/utils/validation.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
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

