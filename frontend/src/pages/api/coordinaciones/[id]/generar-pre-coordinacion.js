import { authenticateToken } from '@/lib/auth.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar que la coordinación existe y el usuario tiene permisos
    const coordinacion = await Coordinacion.findById(parseInt(id, 10));
    if (!coordinacion) {
      return res.status(404).json({ error: 'Coordinación no encontrada' });
    }

    // Verificar permisos: solo el DJ responsable o admin puede generar pre-coordinación
    if (auth.user.rol !== 'admin' && coordinacion.dj_responsable_id !== auth.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para generar pre-coordinación de esta coordinación' });
    }

    // Verificar que la coordinación tenga tipo de evento
    if (!coordinacion.tipo_evento) {
      return res.status(400).json({ error: 'La coordinación debe tener un tipo de evento para generar pre-coordinación' });
    }

    // Generar token único
    const token = randomUUID();

    // Generar URL (usar la URL del frontend desde variables de entorno o construirla)
    let baseUrl = 'https://janosdjs.com';
    if (process.env.NEXT_PUBLIC_APP_URL) {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL.startsWith('http') 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`;
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    const preCoordinacionUrl = `${baseUrl}/pre-coordinacion/${token}`;

    // Actualizar la coordinación con el token y URL
    const coordinacionActualizada = await Coordinacion.update(parseInt(id, 10), {
      pre_coordinacion_token: token,
      pre_coordinacion_url: preCoordinacionUrl,
      pre_coordinacion_fecha_creacion: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      token,
      url: preCoordinacionUrl,
      coordinacion: coordinacionActualizada,
    });
  } catch (error) {
    console.error('Error al generar pre-coordinación:', error);
    return res.status(500).json({ error: 'Error al generar pre-coordinación' });
  }
}

