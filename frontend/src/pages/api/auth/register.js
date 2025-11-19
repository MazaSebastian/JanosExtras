import { DJ } from '@/lib/models/DJ.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, password, salon_id } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ error: 'Nombre y contraseña son requeridos' });
    }

    if (!salon_id) {
      return res.status(400).json({ error: 'Debes seleccionar un salón' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (nombre.trim().length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    // Verificar si el nombre ya existe
    const existingDJ = await DJ.findByNombre(nombre);
    if (existingDJ) {
      return res.status(400).json({ error: 'Este nombre ya está registrado' });
    }

    // Crear nuevo DJ con salón asignado
    const newDJ = await DJ.create({ nombre, password, salon_id });

    res.status(201).json({
      message: 'DJ registrado exitosamente',
      dj: {
        id: newDJ.id,
        nombre: newDJ.nombre
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar DJ' });
  }
}

