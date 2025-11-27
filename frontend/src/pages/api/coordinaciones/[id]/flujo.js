import { authenticateToken } from '@/lib/auth.js';
import { CoordinacionFlujo } from '@/lib/models/CoordinacionFlujo.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const flujo = await CoordinacionFlujo.findByCoordinacionId(parseInt(id, 10));
      
      if (!flujo) {
        return res.status(404).json({ error: 'Flujo de coordinación no encontrado' });
      }

      // Parsear respuestas JSONB si es string
      if (flujo.respuestas && typeof flujo.respuestas === 'string') {
        try {
          flujo.respuestas = JSON.parse(flujo.respuestas);
          console.log('✅ Respuestas parseadas desde string en GET /flujo');
          console.log('Keys en respuestas:', Object.keys(flujo.respuestas));
          console.log('Tiene velas:', !!flujo.respuestas.velas);
          if (flujo.respuestas.velas) {
            console.log('Tipo de velas:', typeof flujo.respuestas.velas);
            console.log('Valor de velas:', flujo.respuestas.velas);
            if (Array.isArray(flujo.respuestas.velas)) {
              console.log('✅ velas es un array con', flujo.respuestas.velas.length, 'elementos');
            }
          }
        } catch (e) {
          console.error('Error al parsear respuestas:', e);
          flujo.respuestas = {};
        }
      } else if (flujo.respuestas && typeof flujo.respuestas === 'object') {
        console.log('✅ Respuestas ya es un objeto en GET /flujo');
        console.log('Keys en respuestas:', Object.keys(flujo.respuestas));
        console.log('Tiene velas:', !!flujo.respuestas.velas);
        if (flujo.respuestas.velas) {
          console.log('Tipo de velas:', typeof flujo.respuestas.velas);
          console.log('Valor de velas:', flujo.respuestas.velas);
          if (Array.isArray(flujo.respuestas.velas)) {
            console.log('✅ velas es un array con', flujo.respuestas.velas.length, 'elementos');
          }
        }
      }

      return res.json(flujo);
    } catch (error) {
      console.error('Error al obtener flujo de coordinación:', error);
      return res.status(500).json({ error: 'Error al obtener flujo de coordinación' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { paso_actual, respuestas, tipo_evento } = req.body;

      // Obtener la coordinación para obtener el tipo_evento si no se proporciona
      const coordinacion = await Coordinacion.findById(parseInt(id, 10));
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }

      const tipoEvento = tipo_evento || coordinacion.tipo_evento;
      if (!tipoEvento) {
        return res.status(400).json({ error: 'El tipo de evento es requerido' });
      }

      // Guardar o actualizar el flujo
      const flujo = await CoordinacionFlujo.create({
        coordinacion_id: parseInt(id, 10),
        paso_actual: paso_actual || 1,
        tipo_evento: tipoEvento,
        respuestas: respuestas || {},
        estado: 'en_proceso',
      });

      return res.json(flujo);
    } catch (error) {
      console.error('Error al guardar flujo de coordinación:', error);
      return res.status(500).json({ error: 'Error al guardar flujo de coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

