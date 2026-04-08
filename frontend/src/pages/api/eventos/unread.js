import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
    const auth = authenticateToken(req);
    if (auth.error) {
        return res.status(auth.status).json({ error: auth.error });
    }

    if (req.method === 'GET') {
        try {
            const count = await Event.countUnreadAssignments(auth.user.id);
            res.json({ unread: count });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Error getting unread events:', error);
            res.status(500).json({ error: 'Error al obtener eventos no leídos' });
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}
