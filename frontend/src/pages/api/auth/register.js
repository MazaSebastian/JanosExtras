import { DJ } from '@/lib/models/DJ.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Verificar si el email ya existe
    const existingDJ = await DJ.findByEmail(email);
    if (existingDJ) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear nuevo DJ
    const newDJ = await DJ.create({ nombre, email, password });

    res.status(201).json({
      message: 'DJ registrado exitosamente',
      dj: {
        id: newDJ.id,
        nombre: newDJ.nombre,
        email: newDJ.email
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar DJ' });
  }
}

