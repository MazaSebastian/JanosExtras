import { authenticateToken } from '@/lib/auth.js';
import { DJ } from '@/lib/models/DJ.js';
import { updateDjSchema } from '@/utils/validation.js';
import * as Sentry from '@sentry/nextjs';

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

    const targetDj = await DJ.findById(parseInt(id, 10));
    if (!targetDj) {
      return res.status(404).json({ error: 'DJ no encontrado' });
    }

    const isTargetAdmin = targetDj.rol === 'admin';

    const { nombre, color_hex } = parsed.data;
    let { salon_id } = parsed.data;

    if (isTargetAdmin) {
      salon_id = null;
    }

    const updatedDJ = await DJ.updateAdminFields({
      id: parseInt(id, 10),
      nombre,
      salon_id,
      color_hex,
    });

    if (isTargetAdmin) {
      updatedDJ.salon_id = null;
    }

    res.json({ message: 'DJ actualizado', dj: updatedDJ });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error al actualizar DJ:', error);
    res.status(500).json({ error: 'Error al actualizar DJ' });
  }
}

