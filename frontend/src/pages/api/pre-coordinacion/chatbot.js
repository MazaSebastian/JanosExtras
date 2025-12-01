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
    console.log(`[Chatbot] Evaluando condición: openai=${!!openai}, apiKey=${!!apiKey}`);
    if (openai || apiKey) {
      console.log('[Chatbot] ✅ Condición cumplida, entrando al bloque de OpenAI');
      try {
        // Si no tenemos cliente pero sí tenemos API Key, crear uno nuevo
        let clientToUse = openai;
        if (!clientToUse && apiKey) {
          console.log('[Chatbot] Creando cliente OpenAI directamente...');
          const { default: OpenAI } = await import('openai');
          clientToUse = new OpenAI({
            apiKey: apiKey,
          });
          console.log('[Chatbot] ✅ Cliente OpenAI creado directamente');
        }

        if (!clientToUse) {
          console.error('[Chatbot] ❌ No se pudo crear cliente de OpenAI');
          throw new Error('No se pudo crear cliente de OpenAI');
        }
        
        console.log('[Chatbot] ✅ Cliente OpenAI listo para usar');

        const tipoEvento = contextoCompleto.tipoEvento || 'No especificado';
        const pasoActual = contextoCompleto.pasoActual || 1;
        const respuestasCliente = contextoCompleto.respuestasCliente || {};

        // Construir prompt del sistema (simplificado para evitar errores)
        let respuestasTexto = 'Ninguna respuesta completada aún';
        try {
          if (Object.keys(respuestasCliente).length > 0) {
            respuestasTexto = JSON.stringify(respuestasCliente).substring(0, 300);
          }
        } catch (e) {
          console.warn('[Chatbot] Error al serializar respuestasCliente:', e);
        }
        
        const systemPrompt = `Eres un asistente amigable para pre-coordinación de eventos de DJs. Ayudas a clientes a completar su pre-coordinación.

Evento: ${tipoEvento} | Paso: ${pasoActual}
Respuestas: ${respuestasTexto}

Instrucciones:
- Sé amigable y empático
- Explica términos de forma simple
- Sugiere opciones cuando el cliente no esté seguro
- Responde en 2-3 oraciones máximo
- Responde en español argentino

Ayuda al cliente a entender qué información necesita.`;

        console.log('[Chatbot] Llamando a OpenAI API...');
        console.log('[Chatbot] Model: gpt-3.5-turbo');
        console.log('[Chatbot] Mensaje usuario length:', mensajeLimpio.length);
        console.log('[Chatbot] System prompt length:', systemPrompt.length);
        
        const startTime = Date.now();
        
        // Timeout más corto para evitar problemas con Vercel (máximo 8s)
        // Vercel tiene timeout de 30s, pero queremos responder rápido
        // NO usar timeout como parámetro (no es soportado por la API)
        const completion = await Promise.race([
          clientToUse.chat.completions.create({
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
            max_tokens: 150 // Reducido para respuestas más rápidas
            // NO incluir timeout aquí - no es un parámetro válido
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OpenAI API timeout')), 8000)
          )
        ]);
        
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
        
        // Manejar diferentes tipos de errores
        if (errorOpenAI.message?.includes('timeout') || errorOpenAI.message?.includes('Timeout')) {
          console.error('[Chatbot] ⏱️ Timeout al llamar a OpenAI');
        } else if (errorOpenAI.status === 400 || errorOpenAI.response?.status === 400) {
          console.error('[Chatbot] ❌ Error 400 de OpenAI - Request inválida');
          console.error('[Chatbot] Verificar formato de mensajes o prompt');
        } else if (errorOpenAI.status === 401 || errorOpenAI.response?.status === 401) {
          console.error('[Chatbot] ❌ Error 401 de OpenAI - API Key inválida');
        } else if (errorOpenAI.status === 429 || errorOpenAI.response?.status === 429) {
          console.error('[Chatbot] ❌ Error 429 de OpenAI - Rate limit excedido');
        }
        
        if (errorOpenAI.response) {
          console.error('[Chatbot] Error response status:', errorOpenAI.response.status);
          console.error('[Chatbot] Error response data:', JSON.stringify(errorOpenAI.response.data, null, 2));
        }
        if (errorOpenAI.cause) {
          console.error('[Chatbot] Error cause:', errorOpenAI.cause);
        }
        console.error('[Chatbot] Stack:', errorOpenAI.stack);
        // Continuar con fallback a reglas simples
        console.log('[Chatbot] ⚠️ Continuando con fallback después de error');
      }
    } else {
      console.warn(`[Chatbot] ⚠️ OpenAI no disponible - NO entró al bloque`);
      console.warn(`[Chatbot] ⚠️ Cliente: ${!!openai}`);
      console.warn(`[Chatbot] ⚠️ API Key: ${!!apiKey}`);
      console.warn(`[Chatbot] ⚠️ process.env.OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
      console.warn(`[Chatbot] ⚠️ Condición (openai || apiKey): ${!!(openai || apiKey)}`);
    }

    // Fallback: usar respuesta de reglas simples (aunque sea genérica)
    console.log('[Chatbot] ⚠️ Usando fallback a reglas simples');
    console.log('[Chatbot] Razón: OpenAI no disponible o falló');
    
    // Agregar información de debug SIEMPRE (para diagnosticar)
    // Reutilizar apiKey que ya fue definida arriba
    const debugInfo = {
      debug: {
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey?.length || 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NO_KEY',
        openaiClient: !!openai,
        respuestaTipo: respuestaSimple.tipo,
        esGenerica: esRespuestaGenérica,
        condicionCumplida: !!(openai || apiKey),
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        razonFallback: !apiKey ? 'No API Key' : !openai ? 'No OpenAI client' : 'Error en llamada OpenAI'
      }
    };
    
    return res.status(200).json({
      respuesta: respuestaSimple.respuesta,
      tipo: respuestaSimple.tipo,
      sugerencias: respuestaSimple.sugerencias || null,
      acciones: respuestaSimple.acciones || null,
      fuente: 'reglas',
      ...debugInfo
    });

  } catch (error) {
    console.error('Error en chatbot API:', error);
    return res.status(500).json({ 
      error: 'Error al procesar el mensaje',
      respuesta: 'Lo siento, hubo un error. Por favor, intenta de nuevo o contacta al DJ directamente.'
    });
  }
}

