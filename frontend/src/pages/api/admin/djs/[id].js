import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';

const COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

export default async function handler(req, res) {
  const { id } = req.query;

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
    const { nombre, salon_id, color_hex } = req.body || {};

    if (
      nombre === undefined &&
      salon_id === undefined &&
      color_hex === undefined
    ) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    if (color_hex !== undefined && color_hex !== null && !COLOR_REGEX.test(color_hex)) {
      return res.status(400).json({ error: 'Color inválido. Usa formato #RRGGBB' });
    }

    const updatedDJ = await DJ.updateAdminFields({
      id: parseInt(id, 10),
      nombre,
      salon_id,
      color_hex,
    });

    if (!updatedDJ) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    res.json({ message: 'DJ actualizado', dj: updatedDJ });
  } catch (error) {
    console.error('Error al actualizar DJ:', error);
    res.status(500).json({ error: 'Error al actualizar DJ' });
  }
}

