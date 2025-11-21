import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';

const COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (auth.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido' });
  }

  try {
    const { id } = req.query;
    const { color_hex } = req.body;

    if (!color_hex || !COLOR_REGEX.test(color_hex)) {
      return res.status(400).json({ error: 'Color inválido. Usa formato #RRGGBB' });
    }

    const updatedDJ = await DJ.updateColor(parseInt(id, 10), color_hex);

    if (!updatedDJ) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    res.json({ message: 'Color actualizado', dj: updatedDJ });
  } catch (error) {
    console.error('Error al actualizar color:', error);
    res.status(500).json({ error: 'Error al actualizar color' });
  }
}

