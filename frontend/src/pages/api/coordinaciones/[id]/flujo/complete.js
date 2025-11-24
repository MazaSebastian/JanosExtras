import { authenticateToken } from '@/lib/auth.js';
import { CoordinacionFlujo } from '@/lib/models/CoordinacionFlujo.js';
import { Coordinacion } from '@/lib/models/Coordinacion.js';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      const { respuestas, tipo_evento } = req.body;

      if (!respuestas) {
        return res.status(400).json({ error: 'Las respuestas son requeridas' });
      }

      // Obtener la coordinación para obtener el tipo_evento si no se proporciona
      const coordinacion = await Coordinacion.findById(parseInt(id, 10));
      if (!coordinacion) {
        return res.status(404).json({ error: 'Coordinación no encontrada' });
      }

      const tipoEvento = tipo_evento || coordinacion.tipo_evento;
      if (!tipoEvento) {
        return res.status(400).json({ error: 'El tipo de evento es requerido' });
      }

      // Guardar o actualizar el flujo como completado
      let flujo = await CoordinacionFlujo.findByCoordinacionId(parseInt(id, 10));
      
      if (flujo) {
        // Actualizar flujo existente
        flujo = await CoordinacionFlujo.complete(parseInt(id, 10), respuestas);
      } else {
        // Crear nuevo flujo completado
        // Primero crear el flujo
        flujo = await CoordinacionFlujo.create({
          coordinacion_id: parseInt(id, 10),
          paso_actual: 999, // Indicador de completado
          tipo_evento: tipoEvento,
          respuestas,
          estado: 'completado',
        });
        // Luego marcarlo como completado
        flujo = await CoordinacionFlujo.complete(parseInt(id, 10), respuestas);
      }

      // Actualizar el estado de la coordinación a 'completado'
      await Coordinacion.update(parseInt(id, 10), { estado: 'completado' });

      return res.json(flujo);
    } catch (error) {
      console.error('Error al completar flujo de coordinación:', error);
      return res.status(500).json({ error: 'Error al completar flujo de coordinación' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

