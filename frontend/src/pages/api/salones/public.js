import { Salon } from '@/lib/models/Salon.js';
import { cached } from '@/lib/utils/cache.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Cache de salones por 10 minutos (cambian poco)
    const salones = await cached(
      'salones:public:all',
      () => Salon.findAll(),
      10 * 60 * 1000 // 10 minutos
    );
    
    // Headers de cache para el cliente
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
    res.json(salones);
  } catch (error) {
    console.error('Error al obtener salones:', error);
    res.status(500).json({ error: 'Error al obtener salones' });
  }
}

