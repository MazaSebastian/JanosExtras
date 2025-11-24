import { authenticateToken } from '@/lib/auth';
import { AdicionalTecnica } from '@/lib/models/AdicionalTecnica';

export default async function handler(req, res) {
  const auth = authenticateToken(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    try {
      const { salon_id, fecha_evento, startDate, endDate } = req.query;
      
      const adicionales = await AdicionalTecnica.findAll({
        salon_id: salon_id ? parseInt(salon_id) : null,
        fecha_evento: fecha_evento || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      return res.status(200).json({ data: adicionales || [] });
    } catch (error) {
      console.error('Error al obtener adicionales:', error);
      // Si la tabla no existe, devolver array vacío en lugar de error
      if (error.message && error.message.includes('does not exist')) {
        return res.status(200).json({ data: [] });
      }
      return res.status(500).json({ error: 'Error al obtener adicionales técnicos' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Solo administradores pueden crear adicionales
      if (auth.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden crear adicionales' });
      }

      const { salon_id, fecha_evento, adicionales, notas, archivo_pdf_url } = req.body;

      if (!salon_id || !fecha_evento) {
        return res.status(400).json({ error: 'Salón y fecha son requeridos' });
      }

      const adicional = await AdicionalTecnica.create({
        salon_id: parseInt(salon_id),
        fecha_evento,
        adicionales: adicionales || {},
        notas: notas || null,
        archivo_pdf_url: archivo_pdf_url || null,
        creado_por: auth.user.id,
      });

      return res.status(201).json({ 
        data: {
          ...adicional,
          adicionales: typeof adicional.adicionales === 'string' 
            ? JSON.parse(adicional.adicionales) 
            : adicional.adicionales,
        }
      });
    } catch (error) {
      console.error('Error al crear adicional:', error);
      return res.status(500).json({ error: 'Error al crear adicional técnico' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

