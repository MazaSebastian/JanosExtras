# Guía de Implementación de OpenAI para el Chatbot

**Fecha:** 2025-01-28  
**Estado Actual:** Fase 1 MVP (Reglas simples) ✅  
**Próximo Paso:** Fase 2 - Integración con OpenAI

---

## 📋 Resumen

Actualmente el chatbot funciona con **reglas simples** (Fase 1 MVP). Para implementar **OpenAI** (Fase 2), necesitamos integrar la API de OpenAI para conversaciones más naturales e inteligentes.

---

## ✅ Lo que Ya Tenemos (Fase 1)

- ✅ Componente de chatbot funcional
- ✅ Base de conocimiento con FAQs
- ✅ API endpoint funcionando
- ✅ UI completa y responsive
- ✅ Integración en página de pre-coordinación

---

## 🔧 Lo que Necesitamos para OpenAI (Fase 2)

### 1. Cuenta y API Key de OpenAI

**Pasos:**
1. Crear cuenta en [OpenAI Platform](https://platform.openai.com)
2. Agregar método de pago (tarjeta de crédito)
3. Generar API Key:
   - Ir a: https://platform.openai.com/api-keys
   - Crear nueva clave secreta
   - **IMPORTANTE:** Guardar la clave (solo se muestra una vez)

**Costo Estimado:**
- GPT-3.5-turbo: ~$0.002 por conversación (muy económico)
- GPT-4: ~$0.01-0.03 por conversación
- **Recomendación:** Empezar con GPT-3.5-turbo (suficiente y económico)

### 2. Instalar Paquete de OpenAI

```bash
cd frontend
npm install openai
```

### 3. Variable de Entorno

Agregar en Vercel (Variables de Entorno):
```
OPENAI_API_KEY=sk-...
```

Y en `.env.local` para desarrollo:
```
OPENAI_API_KEY=sk-...
```

### 4. Modificar el Código

Necesitamos modificar:
- `frontend/src/pages/api/pre-coordinacion/chatbot.js` - Integrar OpenAI
- `frontend/src/lib/chatbot/knowledgeBase.js` - Agregar función con OpenAI

---

## 💻 Implementación Técnica

### Opción 1: Híbrida (Recomendada)

**Estrategia:**
- Reglas simples para casos comunes (rápido y barato)
- OpenAI para casos complejos y preguntas abiertas
- Mejor balance costo/rendimiento

**Ventajas:**
- Reduce costos (no todas las preguntas usan IA)
- Más rápido para respuestas comunes
- Mejor experiencia general

### Opción 2: Solo OpenAI

**Estrategia:**
- Todas las preguntas van a OpenAI
- Más natural pero más costoso

**Ventajas:**
- Conversaciones más naturales
- Mejor comprensión de contexto

---

## 📝 Código de Implementación

### 1. Modificar API Endpoint

```javascript
// frontend/src/pages/api/pre-coordinacion/chatbot.js
import OpenAI from 'openai';
import { procesarMensaje, buscarRespuesta } from '@/lib/chatbot/knowledgeBase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // ... código existente ...
  
  // Primero intentar con reglas simples (rápido y barato)
  const respuestaSimple = buscarRespuesta(mensaje, contexto.tipoEvento);
  
  if (respuestaSimple) {
    return res.json({
      respuesta: respuestaSimple.respuesta,
      tipo: respuestaSimple.tipo,
      fuente: 'reglas'
    });
  }
  
  // Si no hay respuesta simple, usar OpenAI
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un asistente amigable para pre-coordinación de eventos. 
          Ayudas a los clientes a completar su pre-coordinación de forma clara y amigable.
          Tipo de evento: ${contexto.tipoEvento || 'No especificado'}
          Paso actual: ${contexto.pasoActual || 1}
          Contexto: ${JSON.stringify(contexto.respuestasCliente || {})}`
        },
        {
          role: 'user',
          content: mensaje
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    return res.json({
      respuesta: completion.choices[0].message.content,
      tipo: 'ia',
      fuente: 'openai'
    });
  } catch (error) {
    // Fallback a respuesta por defecto
    return res.json({
      respuesta: 'Lo siento, no pude procesar tu pregunta. ¿Podrías reformularla?',
      tipo: 'error'
    });
  }
}
```

### 2. Actualizar Base de Conocimiento

```javascript
// frontend/src/lib/chatbot/knowledgeBase.js

// Agregar función para usar OpenAI cuando sea necesario
export async function procesarConOpenAI(mensaje, contexto) {
  // Esta función se llamará desde el API endpoint
  // No necesita cambios aquí, solo en el endpoint
}
```

---

## 💰 Costos Estimados

### GPT-3.5-turbo (Recomendado para empezar)

**Precios:**
- Input: $0.50 por 1M tokens
- Output: $1.50 por 1M tokens

**Estimación por conversación:**
- ~500 tokens por conversación
- **Costo:** ~$0.001-0.002 por conversación
- **100 conversaciones/mes:** ~$0.10-0.20
- **1000 conversaciones/mes:** ~$1-2

### GPT-4 (Más potente, más caro)

**Precios:**
- Input: $10-30 por 1M tokens (depende del modelo)
- Output: $30-60 por 1M tokens

**Estimación por conversación:**
- **Costo:** ~$0.01-0.03 por conversación
- **1000 conversaciones/mes:** ~$10-30

### Recomendación

**Empezar con GPT-3.5-turbo:**
- ✅ Suficiente para la mayoría de casos
- ✅ Muy económico
- ✅ Rápido
- ✅ Puedes cambiar a GPT-4 después si es necesario

---

## 🚀 Plan de Implementación

### Paso 1: Configuración Inicial (5 minutos)

1. Crear cuenta en OpenAI
2. Generar API Key
3. Agregar variable de entorno en Vercel

### Paso 2: Instalación (2 minutos)

```bash
cd frontend
npm install openai
```

### Paso 3: Modificar Código (15-20 minutos)

1. Modificar `chatbot.js` API endpoint
2. Agregar lógica híbrida (reglas + OpenAI)
3. Probar localmente

### Paso 4: Testing (10 minutos)

1. Probar con preguntas comunes (deben usar reglas)
2. Probar con preguntas complejas (deben usar OpenAI)
3. Verificar costos en dashboard de OpenAI

### Paso 5: Deploy (2 minutos)

1. Commit y push
2. Verificar en producción
3. Monitorear costos

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Proteger API Key

- ✅ **NUNCA** exponer en el frontend
- ✅ Solo usar en API routes (server-side)
- ✅ Usar variables de entorno
- ✅ Rotar keys periódicamente

### 2. Rate Limiting

Agregar rate limiting para prevenir abuso:

```javascript
// Limitar requests por IP
const rateLimit = {
  // 20 requests por minuto por IP
  maxRequests: 20,
  windowMs: 60000
};
```

### 3. Validación de Input

```javascript
// Validar y sanitizar mensajes
if (mensaje.length > 500) {
  return res.status(400).json({ error: 'Mensaje demasiado largo' });
}
```

### 4. Monitoreo de Costos

- Configurar alertas en OpenAI Dashboard
- Límite de gasto mensual
- Monitorear uso diario

---

## 📊 Mejoras con OpenAI

### Antes (Reglas Simples)
```
Usuario: "No sé qué canción elegir para el vals"
Bot: "Te puedo ayudar! Para ingresos de casamiento, estas son populares: ..."
```

### Después (Con OpenAI)
```
Usuario: "No sé qué canción elegir para el vals"
Bot: "Entiendo que puede ser difícil elegir. El vals es un momento muy especial. 
     ¿Qué tipo de música te gusta? ¿Prefieres algo clásico y romántico, o algo 
     más moderno? Basándome en tu estilo de casamiento (Formal y Elegante), 
     te sugiero estas opciones: ..."
```

**Ventajas:**
- ✅ Más natural y conversacional
- ✅ Mejor comprensión del contexto
- ✅ Respuestas personalizadas
- ✅ Maneja preguntas abiertas mejor

---

## 🎯 Configuración del Prompt del Sistema

El prompt del sistema es crucial para que OpenAI entienda su rol:

```javascript
const systemPrompt = `Eres un asistente amigable para pre-coordinación de eventos de DJs.
Tu objetivo es ayudar a los clientes a completar su pre-coordinación de forma clara y amigable.

INFORMACIÓN DEL EVENTO:
- Tipo: ${tipoEvento}
- Paso actual: ${pasoActual}
- Respuestas ya completadas: ${JSON.stringify(respuestasCliente)}

INSTRUCCIONES:
1. Sé amigable, profesional y empático
2. Explica términos técnicos de forma simple
3. Sugiere opciones cuando el cliente no esté seguro
4. Mantén respuestas concisas (máximo 3-4 oraciones)
5. Si no sabes algo, admítelo y ofrece contactar al DJ
6. Usa emojis moderadamente para hacer la conversación más amigable

CONTEXTO:
El cliente está completando un formulario de pre-coordinación paso a paso.
Ayúdalo a entender qué información necesita y por qué.`;
```

---

## 📈 Monitoreo y Optimización

### Métricas a Monitorear

1. **Uso de OpenAI:**
   - % de preguntas que usan IA vs reglas
   - Costo por conversación
   - Tiempo de respuesta

2. **Calidad:**
   - Satisfacción del usuario
   - Preguntas que requieren clarificación
   - Errores o respuestas incorrectas

3. **Optimización:**
   - Identificar preguntas frecuentes para agregar a reglas
   - Ajustar prompts según feedback
   - Optimizar costos

---

## 🔄 Migración Gradual

### Estrategia Recomendada

1. **Semana 1-2:** Implementar híbrido, monitorear uso
2. **Semana 3-4:** Analizar qué preguntas van a OpenAI
3. **Semana 5+:** Agregar más reglas para preguntas frecuentes
4. **Ongoing:** Optimizar prompts y reducir costos

---

## ⚠️ Consideraciones Importantes

### 1. Privacidad de Datos

- OpenAI puede usar datos para entrenar modelos (configurable)
- Revisar política de privacidad
- Considerar datos sensibles del cliente

### 2. Límites de Rate

- OpenAI tiene límites de requests por minuto
- Implementar retry logic
- Considerar cola de mensajes si hay mucho tráfico

### 3. Fallbacks

- Si OpenAI falla, usar reglas simples
- Si OpenAI es lento, timeout y fallback
- Siempre tener respuesta por defecto

---

## 📝 Checklist de Implementación

### Pre-Implementación
- [ ] Crear cuenta en OpenAI
- [ ] Agregar método de pago
- [ ] Generar API Key
- [ ] Configurar límite de gasto mensual

### Implementación
- [ ] Instalar paquete `openai`
- [ ] Agregar variable de entorno `OPENAI_API_KEY`
- [ ] Modificar API endpoint con lógica híbrida
- [ ] Configurar prompt del sistema
- [ ] Agregar manejo de errores y fallbacks

### Testing
- [ ] Probar localmente con API Key
- [ ] Verificar que reglas simples siguen funcionando
- [ ] Probar preguntas complejas con OpenAI
- [ ] Verificar costos en dashboard

### Deploy
- [ ] Agregar variable de entorno en Vercel
- [ ] Commit y push
- [ ] Verificar en producción
- [ ] Monitorear costos y uso

---

## 🎯 Próximos Pasos Inmediatos

1. **Crear cuenta OpenAI** (5 min)
   - https://platform.openai.com/signup

2. **Generar API Key** (2 min)
   - https://platform.openai.com/api-keys

3. **Agregar variable de entorno en Vercel** (2 min)
   - Dashboard → Settings → Environment Variables
   - Agregar: `OPENAI_API_KEY`

4. **Instalar paquete** (1 min)
   ```bash
   cd frontend && npm install openai
   ```

5. **Implementar código** (15-20 min)
   - Modificar API endpoint
   - Agregar lógica híbrida

---

## 💡 Recomendaciones

### Para Empezar

1. **Usar GPT-3.5-turbo** (suficiente y económico)
2. **Implementar híbrido** (reglas + IA)
3. **Configurar límite de gasto** ($10-20/mes inicialmente)
4. **Monitorear uso** durante las primeras semanas

### Optimización Futura

1. Agregar más reglas para preguntas frecuentes
2. Ajustar prompts según feedback
3. Considerar GPT-4 solo para casos complejos
4. Implementar caching de respuestas similares

---

## 📚 Recursos

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Pricing](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

---

**¿Listo para implementar?** Solo necesitas:
1. API Key de OpenAI
2. Instalar el paquete
3. Modificar el código (te ayudo con esto)

¿Quieres que implemente el código ahora o prefieres hacerlo paso a paso?

