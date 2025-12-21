import { authenticateToken } from '@/lib/auth.js';
import { Fichada } from '@/lib/models/Fichada.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const auth = authenticateToken(req);
    if (auth.error) {
        return res.status(auth.status).json({ error: auth.error });
    }

    // Validar rol de administrador
    if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    try {
        const liveStatus = await Fichada.getLiveStatus();
        return res.json(liveStatus);
    } catch (error) {
        console.error('Error al obtener estado en vivo:', error);
        return res.status(500).json({ error: 'Error al obtener estado del sistema.' });
    }
}
