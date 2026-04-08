import { authenticateToken } from '@/lib/auth.js';
import { Event } from '@/lib/models/Event.js';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req, res) {
    const auth = authenticateToken(req);
    if (auth.error) {
        return res.status(auth.status).json({ error: auth.error });
    }

    if (req.method === 'POST') {
        try {
            await Event.markAssignmentsSeen(auth.user.id);
            res.json({ success: true });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Error marking events as seen:', error);
            res.status(500).json({ error: 'Error al marcar eventos como leídos' });
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}
