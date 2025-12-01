import { procesarMensaje } from '@/lib/chatbot/knowledgeBase';

/**
 * API Endpoint para el Chatbot de Pre-Coordinación
 * Fase 1: MVP con reglas simples (sin IA)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { mensaje, contexto } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Procesar mensaje con la base de conocimiento
    const respuesta = procesarMensaje(mensaje.trim(), contexto || {});

    // Retornar respuesta
    return res.status(200).json({
      respuesta: respuesta.respuesta,
      tipo: respuesta.tipo,
      sugerencias: respuesta.sugerencias || null,
      acciones: respuesta.acciones || null
    });

  } catch (error) {
    console.error('Error en chatbot API:', error);
    return res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      respuesta: 'Lo siento, hubo un error. Por favor, intenta de nuevo o contacta al DJ directamente.'
    });
  }
}

