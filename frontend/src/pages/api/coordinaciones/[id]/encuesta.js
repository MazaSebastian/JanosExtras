import { authenticateToken } from '@/lib/auth.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { id } = req.query;

    if (req.method === 'POST') {
        try {
            const {
                atencion_coordinacion,
                presencia_evento,
                musicalizacion,
                calidad_tecnica,
                calificacion_general,
                comentarios
            } = req.body;

            const coordinacionId = parseInt(id, 10);

            // Verify coordination exists
            const coordinacion = await Coordinacion.findById(coordinacionId);
            if (!coordinacion) {
                return res.status(404).json({ error: 'Coordinación no encontrada' });
            }

            const encuestaRespuestas = {
                atencion_coordinacion,
                presencia_evento,
                musicalizacion,
                calidad_tecnica,
                calificacion_general,
                comentarios,
                submitted_at: new Date().toISOString()
            };

            // Save survey
            await Coordinacion.update(coordinacionId, {
                encuesta_completada: true,
                encuesta_respuestas: JSON.stringify(encuestaRespuestas)
            });

            return res.status(200).json({ message: 'Encuesta guardada con éxito' });
        } catch (error) {
            console.error('Error al guardar encuesta:', error);
            return res.status(500).json({ error: 'Error interno del servidor al procesar la encuesta', details: error.message });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
}
