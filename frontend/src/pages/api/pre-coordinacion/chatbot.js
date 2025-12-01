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
  
  // Debug: Verificar todas las variables de entorno relacionadas
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('OPENAI') || key.includes('OPEN_AI')
  );
  console.log('[Chatbot] Variables de entorno relacionadas con OpenAI:', envKeys);
  console.log('[Chatbot] OPENAI_API_KEY existe:', !!process.env.OPENAI_API_KEY);
  console.log('[Chatbot] OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('[Chatbot] OPENAI_API_KEY prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'N/A');
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY no está configurada en variables de entorno');
    console.warn('⚠️ Variables de entorno disponibles:', Object.keys(process.env).slice(0, 20));
    return null;
  }

  // Verificar que la key no esté vacía o solo con espacios
  const apiKey = process.env.OPENAI_API_KEY.trim();
  if (!apiKey || apiKey.length < 50) {
    console.warn('⚠️ OPENAI_API_KEY parece inválida (muy corta o vacía)');
    return null;
  }

  try {
    const { default: OpenAI } = await import('openai');
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    console.log('✅ OpenAI inicializado correctamente');
    console.log('✅ API Key length:', apiKey.length);
    return openaiClient;
  } catch (error) {
    console.error('⚠️ Error al inicializar OpenAI:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

export default async function handler(req, res) {
  // Log inicial para verificar que el endpoint se está llamando
  console.log('[Chatbot API] Request recibido:', {
    method: req.method,
    timestamp: new Date().toISOString(),
    hasBody: !!req.body
  });

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
    
    // Tipos que NO deben usar OpenAI (tienen respuestas específicas buenas)
    const tiposConBuenaRespuesta = ['saludo', 'despedida', 'ayuda', 'sugerencias', 'faq', 'termino'];
    
    if (!esRespuestaGenérica && tiposConBuenaRespuesta.includes(respuestaSimple.tipo)) {
      // Tenemos una buena respuesta de reglas simples
      console.log(`[Chatbot] Usando respuesta de reglas simples (tipo: ${respuestaSimple.tipo})`);
      return res.status(200).json({
        respuesta: respuestaSimple.respuesta,
        tipo: respuestaSimple.tipo,
        sugerencias: respuestaSimple.sugerencias || null,
        acciones: respuestaSimple.acciones || null,
        fuente: 'reglas'
      });
    }

    // Si no hay buena respuesta de reglas, intentar con OpenAI (si está disponible)
    console.log(`[Chatbot] Respuesta genérica detectada, intentando usar OpenAI...`);
    
    // Verificar API Key directamente (no depender de getOpenAIClient para esto)
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    console.log(`[Chatbot] API Key presente: ${!!apiKey}`);
    console.log(`[Chatbot] API Key length: ${apiKey?.length || 0}`);
    console.log(`[Chatbot] API Key prefix: ${apiKey?.substring(0, 10) || 'N/A'}`);
    
    const openai = await getOpenAIClient();
    console.log(`[Chatbot] Cliente OpenAI obtenido: ${!!openai}`);
    
    // Intentar usar OpenAI si tenemos la key (aunque getOpenAIClient haya fallado)
    if (openai || apiKey) {
      try {
        // Si no tenemos cliente pero sí tenemos API Key, crear uno nuevo
        let clientToUse = openai;
        if (!clientToUse && apiKey) {
          console.log('[Chatbot] Creando cliente OpenAI directamente...');
          const { default: OpenAI } = await import('openai');
          clientToUse = new OpenAI({
            apiKey: apiKey,
          });
        }

        if (!clientToUse) {
          throw new Error('No se pudo crear cliente de OpenAI');
        }

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

        console.log('[Chatbot] Llamando a OpenAI API...');
        console.log('[Chatbot] Model: gpt-3.5-turbo');
        console.log('[Chatbot] Mensaje usuario length:', mensajeLimpio.length);
        
        const startTime = Date.now();
        const completion = await clientToUse.chat.completions.create({
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
          timeout: 15000 // 15 segundos timeout
        });
        const elapsedTime = Date.now() - startTime;
        console.log(`[Chatbot] OpenAI API respondió en ${elapsedTime}ms`);

        const respuestaIA = completion.choices[0]?.message?.content?.trim();
        
        if (respuestaIA) {
          console.log(`[Chatbot] ✅ Respuesta de OpenAI generada exitosamente`);
          console.log(`[Chatbot] Respuesta length: ${respuestaIA.length} caracteres`);
          console.log(`[Chatbot] Respuesta preview: ${respuestaIA.substring(0, 100)}...`);
          return res.status(200).json({
            respuesta: respuestaIA,
            tipo: 'ia',
            fuente: 'openai',
            sugerencias: null,
            acciones: null
          });
        } else {
          console.warn('[Chatbot] ⚠️ OpenAI no retornó respuesta válida');
          console.warn('[Chatbot] Completion object keys:', Object.keys(completion || {}));
          console.warn('[Chatbot] Completion choices:', completion?.choices?.length || 0);
          if (completion?.choices?.[0]) {
            console.warn('[Chatbot] First choice:', JSON.stringify(completion.choices[0], null, 2));
          }
        }
      } catch (errorOpenAI) {
        console.error('[Chatbot] ❌ Error con OpenAI:', errorOpenAI.message);
        console.error('[Chatbot] Error name:', errorOpenAI.name);
        console.error('[Chatbot] Error code:', errorOpenAI.code);
        console.error('[Chatbot] Error type:', errorOpenAI.constructor.name);
        if (errorOpenAI.response) {
          console.error('[Chatbot] Error response status:', errorOpenAI.response.status);
          console.error('[Chatbot] Error response data:', errorOpenAI.response.data);
        }
        if (errorOpenAI.cause) {
          console.error('[Chatbot] Error cause:', errorOpenAI.cause);
        }
        console.error('[Chatbot] Stack:', errorOpenAI.stack);
        // Continuar con fallback a reglas simples
      }
    } else {
      console.warn(`[Chatbot] ⚠️ OpenAI no disponible`);
      console.warn(`[Chatbot] ⚠️ Cliente: ${!!openai}`);
      console.warn(`[Chatbot] ⚠️ API Key: ${!!apiKey}`);
      console.warn(`[Chatbot] ⚠️ process.env.OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
    }

    // Fallback: usar respuesta de reglas simples (aunque sea genérica)
    console.log('[Chatbot] ⚠️ Usando fallback a reglas simples');
    console.log('[Chatbot] Razón: OpenAI no disponible o falló');
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

