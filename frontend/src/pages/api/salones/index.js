import { authenticateToken } from '@/lib/auth.js';
import { Salon } from '@/lib/models/Salon.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const salones = await Salon.findAll();
      res.json(salones);
    } catch (error) {
      console.error('Error al obtener salones:', error);
      res.status(500).json({ error: 'Error al obtener salones' });
    }
  } else if (req.method === 'POST') {
    try {
      const { nombre, direccion } = req.body;

      if (!nombre || !direccion) {
        return res.status(400).json({ error: 'Nombre y dirección son requeridos' });
      }

      const salon = await Salon.create({ nombre, direccion });
      res.status(201).json(salon);
    } catch (error) {
      console.error('Error al crear salón:', error);
      res.status(500).json({ error: 'Error al crear salón' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}

