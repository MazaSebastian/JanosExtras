import { Salon } from '@/lib/models/Salon.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const salones = await Salon.findAll();
    res.json(salones);
  } catch (error) {
    console.error('Error al obtener salones:', error);
    res.status(500).json({ error: 'Error al obtener salones' });
  }
}

