import { Coordinacion } from '@/lib/models/Coordinacion.js';
import { CoordinacionFlujo } from '@/lib/models/CoordinacionFlujo.js';
import pool from '@/lib/database-config.js';

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }

  if (req.method === 'GET') {
    try {
      // Buscar coordinación por token (público, sin autenticación)
      const query = `
        SELECT 
          c.id,
          c.titulo,
          c.nombre_cliente,
          c.tipo_evento,
          c.codigo_evento,
          c.fecha_evento,
          c.hora_evento,
          c.salon_id,
          c.pre_coordinacion_completado_por_cliente,
          c.pre_coordinacion_fecha_completado,
          s.nombre AS salon_nombre
        FROM coordinaciones c
        LEFT JOIN salones s ON c.salon_id = s.id
        WHERE c.pre_coordinacion_token = $1
          AND c.activo = true
      `;
      
      const result = await pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pre-coordinación no encontrada o inválida' });
      }

      const coordinacion = result.rows[0];

      // Verificar si la fecha del evento ya pasó (opcional: invalidar tokens viejos)
      if (coordinacion.fecha_evento) {
        const fechaEvento = new Date(coordinacion.fecha_evento);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        if (fechaEvento < hoy) {
          return res.status(400).json({ error: 'Esta pre-coordinación ha expirado (la fecha del evento ya pasó)' });
        }
      }

      // Cargar respuestas existentes del cliente si las hay
      let respuestasCliente = {};
      try {
        const flujo = await CoordinacionFlujo.findByCoordinacionId(coordinacion.id);
        if (flujo && flujo.respuestas) {
          respuestasCliente = typeof flujo.respuestas === 'string' 
            ? JSON.parse(flujo.respuestas) 
            : flujo.respuestas;
        }
      } catch (err) {
        console.log('No hay respuestas previas del cliente');
      }

      return res.json({
        coordinacion,
        respuestasCliente,
      });
    } catch (error) {
      console.error('Error al obtener pre-coordinación:', error);
      return res.status(500).json({ error: 'Error al obtener pre-coordinación' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Guardar respuestas del cliente
      const { respuestas } = req.body;

      console.log('API recibió respuestas:', respuestas);
      console.log('Total de respuestas recibidas:', respuestas ? Object.keys(respuestas).length : 0);
      console.log('Keys de respuestas recibidas:', respuestas ? Object.keys(respuestas) : []);

      if (!respuestas || typeof respuestas !== 'object') {
        return res.status(400).json({ error: 'Las respuestas son requeridas' });
      }

      // Buscar coordinación por token
      const query = `
        SELECT id, tipo_evento
        FROM coordinaciones
        WHERE pre_coordinacion_token = $1
          AND activo = true
      `;
      
      const result = await pool.query(query, [token]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pre-coordinación no encontrada o inválida' });
      }

      const coordinacion = result.rows[0];

      // Guardar o actualizar el flujo con las respuestas del cliente
      let flujo = await CoordinacionFlujo.findByCoordinacionId(coordinacion.id);
      
      if (flujo) {
        // Actualizar respuestas existentes (merge, no sobrescribir)
        const respuestasExistentes = typeof flujo.respuestas === 'string' 
          ? JSON.parse(flujo.respuestas) 
          : flujo.respuestas || {};
        
        console.log('Respuestas existentes antes del merge:', respuestasExistentes);
        console.log('Nuevas respuestas recibidas:', respuestas);
        
        const respuestasCombinadas = {
          ...respuestasExistentes,
          ...respuestas, // Las nuevas respuestas sobrescriben las existentes
        };

        console.log('Respuestas combinadas después del merge:', respuestasCombinadas);
        console.log('Total de respuestas combinadas:', Object.keys(respuestasCombinadas).length);

        // Actualizar el flujo
        flujo = await CoordinacionFlujo.update(coordinacion.id, {
          respuestas: respuestasCombinadas,
        });
      } else {
        // Crear nuevo flujo
        console.log('Creando nuevo flujo con respuestas:', respuestas);
        flujo = await CoordinacionFlujo.create({
          coordinacion_id: coordinacion.id,
          paso_actual: 999, // Indica que fue completado por el cliente
          tipo_evento: coordinacion.tipo_evento,
          respuestas: respuestas,
          estado: 'completado_por_cliente',
        });
      }
      
      console.log('=== FLUJO GUARDADO ===');
      console.log('Flujo guardado, respuestas finales:', flujo.respuestas);
      console.log('Tipo de respuestas finales:', typeof flujo.respuestas);
      if (flujo.respuestas) {
        console.log('Keys de respuestas finales:', Object.keys(flujo.respuestas));
        console.log('Total de respuestas finales:', Object.keys(flujo.respuestas).length);
        console.log('Respuestas finales completas:', JSON.stringify(flujo.respuestas, null, 2));
      }

      // Marcar la coordinación como completada por el cliente
      await Coordinacion.update(coordinacion.id, {
        pre_coordinacion_completado_por_cliente: true,
        pre_coordinacion_fecha_completado: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: 'Respuestas guardadas correctamente',
        flujo,
      });
    } catch (error) {
      console.error('Error al guardar respuestas de pre-coordinación:', error);
      return res.status(500).json({ error: 'Error al guardar respuestas' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

