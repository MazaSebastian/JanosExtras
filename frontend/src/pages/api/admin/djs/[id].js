import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';
import { updateDjSchema } from '@/utils/validation.js';

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
    const parsed = updateDjSchema.safeParse({
      nombre: req.body?.nombre,
      salon_id:
        req.body?.salon_id === null || req.body?.salon_id === ''
          ? null
          : req.body?.salon_id !== undefined
          ? parseInt(req.body?.salon_id, 10)
          : undefined,
      color_hex: req.body?.color_hex,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { nombre, salon_id, color_hex } = parsed.data;

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

