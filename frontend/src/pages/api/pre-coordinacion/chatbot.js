import { procesarMensaje, buscarRespuesta } from '@/lib/chatbot/knowledgeBase';

/**
 * API Endpoint para el Chatbot de Pre-Coordinación
 * Fase 2: Híbrido - Reglas simples + OpenAI
 */

// Inicializar OpenAI de forma lazy (solo cuando se necesite)
let openaiClient = null;
let openaiInitialized = false;

async function getOpenAIClient() {
  if (openaiInitialized) {
    return openaiClient;
  }
  
  openaiInitialized = true;
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY no está configurada en variables de entorno');
    return null;
  }

  try {
    const { default: OpenAI } = await import('openai');
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI inicializado correctamente');
    return openaiClient;
  } catch (error) {
    console.error('⚠️ Error al inicializar OpenAI:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { mensaje, contexto } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Validar longitud del mensaje (prevenir abuso)
    if (mensaje.length > 500) {
      return res.status(400).json({ 
        error: 'Mensaje demasiado largo',
        respuesta: 'Por favor, envía un mensaje más corto (máximo 500 caracteres).'
      });
    }

    const mensajeLimpio = mensaje.trim();
    const contextoCompleto = contexto || {};

    // ESTRATEGIA HÍBRIDA: Primero intentar con reglas simples (rápido y barato)
    const respuestaSimple = procesarMensaje(mensajeLimpio, contextoCompleto);
    
    // Si encontramos una respuesta con reglas simples, usarla
    // Solo usar OpenAI si la respuesta es genérica o no encontramos nada útil
    const esRespuestaGenérica = respuestaSimple.tipo === 'default' || 
                                 respuestaSimple.tipo === 'pregunta';
    
    console.log(`[Chatbot] Mensaje: "${mensajeLimpio}" | Tipo respuesta: ${respuestaSimple.tipo} | Es genérica: ${esRespuestaGenérica}`);
    
    if (!esRespuestaGenérica) {
      // Tenemos una buena respuesta de reglas simples
      return res.status(200).json({
        respuesta: respuestaSimple.respuesta,
        tipo: respuestaSimple.tipo,
        sugerencias: respuestaSimple.sugerencias || null,
        acciones: respuestaSimple.acciones || null,
        fuente: 'reglas'
      });
    }

    // Si no hay buena respuesta de reglas, intentar con OpenAI (si está disponible)
    console.log(`[Chatbot] Intentando usar OpenAI... | API Key presente: ${!!process.env.OPENAI_API_KEY}`);
    const openai = await getOpenAIClient();
    console.log(`[Chatbot] Cliente OpenAI obtenido: ${!!openai}`);
    
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        const tipoEvento = contextoCompleto.tipoEvento || 'No especificado';
        const pasoActual = contextoCompleto.pasoActual || 1;
        const respuestasCliente = contextoCompleto.respuestasCliente || {};

        // Construir prompt del sistema
        const systemPrompt = `Eres un asistente amigable para pre-coordinación de eventos de DJs.
Tu objetivo es ayudar a los clientes a completar su pre-coordinación de forma clara y amigable.

INFORMACIÓN DEL EVENTO:
- Tipo: ${tipoEvento}
- Paso actual: ${pasoActual}
- Respuestas ya completadas: ${JSON.stringify(respuestasCliente).substring(0, 500)}

INSTRUCCIONES:
1. Sé amigable, profesional y empático
2. Explica términos técnicos de forma simple
3. Sugiere opciones cuando el cliente no esté seguro
4. Mantén respuestas concisas (máximo 3-4 oraciones)
5. Si no sabes algo, admítelo y ofrece contactar al DJ
6. Usa emojis moderadamente para hacer la conversación más amigable
7. Responde en español argentino, de forma natural y cercana

CONTEXTO:
El cliente está completando un formulario de pre-coordinación paso a paso.
Ayúdalo a entender qué información necesita y por qué.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: mensajeLimpio
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
          timeout: 10000 // 10 segundos timeout
        });

        const respuestaIA = completion.choices[0]?.message?.content?.trim();
        
        if (respuestaIA) {
          console.log(`[Chatbot] ✅ Respuesta de OpenAI generada exitosamente`);
          return res.status(200).json({
            respuesta: respuestaIA,
            tipo: 'ia',
            fuente: 'openai',
            sugerencias: null,
            acciones: null
          });
        } else {
          console.warn('[Chatbot] ⚠️ OpenAI no retornó respuesta válida');
        }
      } catch (errorOpenAI) {
        console.error('[Chatbot] ❌ Error con OpenAI:', errorOpenAI.message);
        console.error('[Chatbot] Stack:', errorOpenAI.stack);
        // Continuar con fallback a reglas simples
      }
    } else {
      console.warn(`[Chatbot] ⚠️ OpenAI no disponible. Cliente: ${!!openai}, API Key: ${!!process.env.OPENAI_API_KEY}`);
    }

    // Fallback: usar respuesta de reglas simples (aunque sea genérica)
    return res.status(200).json({
      respuesta: respuestaSimple.respuesta,
      tipo: respuestaSimple.tipo,
      sugerencias: respuestaSimple.sugerencias || null,
      acciones: respuestaSimple.acciones || null,
      fuente: 'reglas'
    });

  } catch (error) {
    console.error('Error en chatbot API:', error);
    return res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      respuesta: 'Lo siento, hubo un error. Por favor, intenta de nuevo o contacta al DJ directamente.'
    });
  }
}

