# Chatbot para Pre-Coordinación - Documentación Completa

**Fecha de creación:** 2025-01-28  
**Estado:** Propuesta para implementación  
**Prioridad:** Alta

---

## 📋 Resumen Ejecutivo

Este documento detalla la propuesta completa para implementar un chatbot inteligente que asista a los clientes durante el proceso de pre-coordinación de eventos. El chatbot guiará conversacionalmente a los usuarios, responderá preguntas frecuentes, ofrecerá sugerencias inteligentes y ayudará a completar el formulario de manera más amigable.

---

## 🎯 Objetivo Principal

Asistir a los clientes durante la pre-coordinación de forma conversacional, guiándolos paso a paso y respondiendo dudas en tiempo real, reduciendo la fricción y mejorando la experiencia de usuario.

---

## ✨ Funcionalidades Principales

### 1. Guía Conversacional Paso a Paso
- El chatbot guía al cliente por cada paso del flujo de pre-coordinación
- Explica qué información se necesita y por qué
- Sugiere respuestas basadas en el tipo de evento
- Valida respuestas antes de avanzar al siguiente paso

### 2. Respuestas a Preguntas Frecuentes
- **Preguntas comunes:**
  - "¿Qué es la recepción?"
  - "¿Puedo cambiar mis respuestas después?"
  - "¿Qué pasa si no sé qué canción elegir?"
  - "¿Cuánto tiempo toma completar esto?"
  - "¿Qué diferencia hay entre ingreso a recepción e ingreso al salón?"
- Respuestas contextuales según el paso actual del formulario

### 3. Sugerencias Inteligentes
- Sugiere opciones según el tipo de evento
- Recomienda canciones populares para momentos específicos
- Sugiere estilos musicales según el perfil del evento
- Ayuda a completar campos con sugerencias relevantes

### 4. Validación y Corrección
- Detecta respuestas incompletas o inconsistentes
- Sugiere correcciones de forma amigable
- Explica errores de manera clara
- Previene errores comunes antes de que ocurran

### 5. Personalización
- Recuerda preferencias mencionadas durante la conversación
- Adapta el lenguaje al tipo de evento
- Ofrece ayuda adicional si detecta confusión

---

## 🏗️ Arquitectura Propuesta

### Opción 1: Chatbot Integrado en la Página de Pre-Coordinación (Recomendado)

```
┌─────────────────────────────────────┐
│  Pre-Coordinación (formulario)      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Chatbot (flotante)           │ │
│  │  💬 ¿Necesitas ayuda?         │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Ventajas:**
- Disponible en cualquier momento sin interrumpir
- No interrumpe el flujo del formulario
- Tiene contexto completo del formulario actual

### Opción 2: Modo Conversacional Alternativo

```
┌─────────────────────────────────────┐
│  Pre-Coordinación Conversacional   │
│                                     │
│  [Bot] Hola! Te ayudo a coordinar  │
│  [Bot] ¿Qué tipo de evento es?     │
│  [Usuario] Es un casamiento         │
│  [Bot] Perfecto! ¿Qué estilo...    │
└─────────────────────────────────────┘
```

**Ventajas:**
- Experiencia más natural y conversacional
- Ideal para usuarios en móviles
- Menos intimidante que formularios largos

### Opción 3: Híbrido (Mejor Experiencia)

- Formulario principal + chatbot de apoyo
- Opción de cambiar a modo conversacional
- El chatbot puede completar el formulario automáticamente

---

## 💬 Flujo de Conversación Ejemplo

```
[Bot] 👋 ¡Hola! Soy tu asistente para la pre-coordinación.
      Te guiaré paso a paso. ¿Listo para comenzar?

[Usuario] Sí, estoy listo

[Bot] Perfecto! Primero, ¿qué tipo de evento vas a realizar?
      Puedes elegir: XV, Casamiento, Corporativo o Cumpleaños

[Usuario] Es un casamiento

[Bot] ¡Qué lindo! 🎉 Para un casamiento, necesitamos coordinar
      varios momentos especiales. Empecemos con el estilo.
      
      ¿Cómo te imaginas tu casamiento?
      - Ceremonial (tradicional y formal)
      - Formal y Elegante
      - Descontracturado

[Usuario] No estoy seguro, ¿cuál recomiendas?

[Bot] Depende del ambiente que busques:
      - Ceremonial: más tradicional, con protocolo
      - Formal: elegante pero más relajado
      - Descontracturado: divertido y casual
      
      ¿Qué ambiente te gusta más para tu día especial?

[Usuario] Creo que Formal y Elegante

[Bot] Excelente elección! ✨ Ahora sobre la música...
      ¿Qué tipo de música te gustaría durante la recepción?
      Puedes elegir varias opciones.

[Usuario] ¿Qué opciones hay?

[Bot] Tienes estas opciones:
      🎵 Música Chill (relajada y ambiente)
      🎸 Acústicos (guitarra, suave)
      🎷 Bossa N Nova (elegante y sofisticada)
      🎸 Rock Nacional
      🎤 Pop Funcional
      🎧 Deep House
      🎶 Música Comercial
      
      ¿Cuáles te gustan más? Puedes elegir varias.

[Usuario] Música Chill y Bossa N Nova

[Bot] Perfecto! Ya registré tu preferencia. 🎵
      Ahora, ¿harán un ingreso especial a la recepción?

[Usuario] ¿Qué significa eso?

[Bot] Es cuando los novios hacen una entrada especial
      al lugar de la recepción, generalmente con una
      canción específica. ¿Lo harán?

[Usuario] Sí, creo que sí

[Bot] ¡Genial! ¿Qué canción les gustaría para ese momento?
      Puedes decirme el nombre y el artista.

[Usuario] No sé qué canción elegir

[Bot] Te puedo ayudar! Para ingresos de casamiento, estas
      son populares:
      - "At Last" - Etta James
      - "Marry You" - Bruno Mars
      - "All of Me" - John Legend
      - "Perfect" - Ed Sheeran
      
      ¿Te gusta alguna de estas? O dime qué estilo prefieres
      y te sugiero más opciones.

[Usuario] Me gusta "Perfect" de Ed Sheeran

[Bot] ¡Hermosa elección! 💕 Ya la registré.
      Continuemos con la ceremonia...
```

---

## 🔧 Tecnologías Recomendadas

### Opción 1: OpenAI GPT-4 (Recomendado)

**Ventajas:**
- Conversaciones muy naturales y contextuales
- Excelente comprensión del contexto
- Fácil integración con API REST
- Buen rendimiento en español

**Costo:**
- ~$0.01-0.03 por conversación completa
- 100 conversaciones/mes ≈ $1-3
- 1000 conversaciones/mes ≈ $10-30

**Implementación:**
```javascript
// Ejemplo básico
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Eres un asistente para pre-coordinación de eventos...' },
      { role: 'user', content: mensajeUsuario }
    ]
  })
});
```

### Opción 2: Google Dialogflow

**Ventajas:**
- Diseñado específicamente para chatbots
- Gestión de intenciones y entidades
- Plan gratuito disponible

**Costo:**
- Plan gratuito: hasta 15,000 requests/mes
- Plan estándar: $0.002 por request

**Implementación:**
- Requiere más configuración inicial
- Necesita definir intenciones y entidades

### Opción 3: Solución Híbrida (Recomendado para MVP)

**Estrategia:**
- Reglas simples para casos comunes (más rápido y barato)
- IA para casos complejos y preguntas abiertas
- Mejor balance costo/rendimiento

**Implementación:**
```javascript
// Primero intentar reglas simples
if (esPreguntaFrecuente(mensaje)) {
  return respuestaPredefinida(mensaje);
}

// Si no, usar IA
return await openai.chat.completions.create(...);
```

---

## 🔌 Integración con el Sistema Actual

### 1. Componente de Chatbot

**Archivo:** `frontend/src/components/ChatbotPreCoordinacion.js`

**Características:**
- Se integra en la página de pre-coordinación (`/pre-coordinacion/[token]`)
- Mantiene contexto del paso actual del formulario
- Sincroniza con el estado del formulario
- Puede completar campos automáticamente

**Estructura:**
```javascript
export default function ChatbotPreCoordinacion({ 
  pasoActual, 
  respuestasCliente, 
  tipoEvento,
  onCompletarCampo 
}) {
  // Lógica del chatbot
}
```

### 2. API Endpoint

**Archivo:** `frontend/src/pages/api/pre-coordinacion/chatbot.js`

**Funcionalidad:**
- Recibe mensajes del usuario
- Procesa con IA o reglas
- Retorna respuesta + acciones (completar campo, etc.)
- Mantiene contexto de la conversación

**Estructura:**
```javascript
export default async function handler(req, res) {
  const { mensaje, token, contexto } = req.body;
  
  // Procesar mensaje
  const respuesta = await procesarMensaje(mensaje, contexto);
  
  // Retornar respuesta y acciones
  res.json({
    respuesta: respuesta.texto,
    acciones: respuesta.acciones, // [{ tipo: 'completar', campo: 'estilo_casamiento', valor: 'Formal' }]
    sugerencias: respuesta.sugerencias
  });
}
```

### 3. Base de Conocimiento

**Archivo:** `frontend/src/lib/chatbot/knowledgeBase.js`

**Contenido:**
- Preguntas frecuentes por tipo de evento
- Sugerencias de canciones populares
- Explicaciones de términos técnicos
- Flujos de conversación predefinidos

**Estructura:**
```javascript
export const FAQs = {
  XV: [
    { pregunta: '¿Qué es la recepción?', respuesta: '...' },
    { pregunta: '¿Qué es el vals?', respuesta: '...' }
  ],
  Casamiento: [
    { pregunta: '¿Qué es la ceremonia?', respuesta: '...' }
  ],
  // ...
};

export const SUGERENCIAS_CANCIONES = {
  ingreso_recepcion: {
    casamiento: ['At Last - Etta James', 'Marry You - Bruno Mars', ...],
    xv: ['...']
  },
  // ...
};
```

---

## 🚀 Características Avanzadas

### 1. Completado Automático

El chatbot puede completar campos del formulario automáticamente:

```
[Usuario] Quiero música chill y acústica para la recepción

[Bot] Perfecto! ¿Quieres que complete ese campo por ti?

[Usuario] Sí

[Bot] ✅ Listo! Ya completé "Música de Recepción" con tus preferencias.
```

### 2. Modo Rápido

Para usuarios con prisa:

```
[Bot] Veo que tienes prisa. ¿Quieres que complete todo con
      opciones por defecto y solo te pregunte lo esencial?

[Usuario] Sí, por favor

[Bot] Perfecto! Te haré solo 3 preguntas clave y completaré
      el resto con opciones estándar.
```

### 3. Recordatorio Inteligente

Si el usuario abandona la pre-coordinación:

```
[Bot] (Después de 24 horas sin actividad)
      Hola! Veo que no terminaste tu pre-coordinación.
      ¿Necesitas ayuda? Puedo guiarte paso a paso.
```

### 4. Análisis de Sentimiento

Detecta frustración o confusión:

```
[Usuario] Esto es muy complicado

[Bot] Entiendo que puede parecer mucho. No te preocupes,
      te guío paso a paso. ¿Quieres que empecemos de nuevo
      de forma más simple?
```

---

## 🎨 Diseño de UI/UX

### Interfaz del Chatbot

```
┌─────────────────────────────────────┐
│  💬 Asistente de Pre-Coordinación   │
├─────────────────────────────────────┤
│                                     │
│  [Bot] 👋 Hola! ¿En qué puedo...   │
│                                     │
│  [Usuario] Necesito ayuda con...   │
│                                     │
│  [Bot] Claro! Te explico...        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Escribe tu mensaje...        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Características Visuales

- **Botón flotante discreto:** No interrumpe, pero está siempre disponible
- **Animaciones suaves:** Transiciones naturales
- **Indicador de escritura:** "Bot está escribiendo..."
- **Botones rápidos:** Para respuestas comunes
- **Soporte para emojis:** Hace la conversación más amigable
- **Formato de mensajes:** Texto, listas, enlaces

### Estados del Chatbot

- **Disponible:** Botón verde, listo para ayudar
- **Escribiendo:** Indicador animado
- **Pensando:** Indicador de procesamiento
- **Error:** Mensaje amigable con opción de reintentar

---

## 📅 Plan de Implementación por Fases

### Fase 1: MVP (2-3 semanas)

**Objetivos:**
- Chatbot básico con reglas simples
- Respuestas a FAQs comunes
- Integración en página de pre-coordinación
- Completado básico de campos

**Entregables:**
- Componente de chatbot funcional
- Base de conocimiento básica
- API endpoint simple
- Integración con formulario

**Tecnología:**
- Reglas simples (sin IA inicialmente)
- Base de conocimiento estática

### Fase 2: IA Básica (1 mes)

**Objetivos:**
- Integración con OpenAI
- Conversaciones más naturales
- Sugerencias inteligentes
- Contexto del formulario

**Entregables:**
- Integración con OpenAI API
- Sistema de contexto
- Sugerencias automáticas
- Mejoras en UX

**Tecnología:**
- OpenAI GPT-3.5-turbo o GPT-4
- Sistema de contexto y memoria

### Fase 3: Avanzado (1-2 meses)

**Objetivos:**
- Modo conversacional completo
- Análisis de sentimiento
- Recordatorios automáticos
- Analytics y mejoras continuas

**Entregables:**
- Modo conversacional alternativo
- Sistema de recordatorios
- Dashboard de analytics
- Mejoras basadas en datos

**Tecnología:**
- Análisis de sentimiento
- Sistema de notificaciones
- Analytics avanzado

---

## 💰 Costos Estimados

### OpenAI GPT-4
- **Por conversación:** ~$0.01-0.03
- **100 conversaciones/mes:** ≈ $1-3
- **1000 conversaciones/mes:** ≈ $10-30
- **10,000 conversaciones/mes:** ≈ $100-300

### Alternativa: GPT-3.5-turbo (Más Económico)
- **Por conversación:** ~$0.002
- **1000 conversaciones/mes:** ≈ $2
- **10,000 conversaciones/mes:** ≈ $20

### Google Dialogflow
- **Plan gratuito:** Hasta 15,000 requests/mes
- **Plan estándar:** $0.002 por request

### Recomendación de Costos
- **Fase 1 (MVP):** $0 (solo reglas)
- **Fase 2 (IA básica):** $10-50/mes (GPT-3.5-turbo)
- **Fase 3 (Avanzado):** $50-200/mes (según volumen)

---

## ✅ Ventajas del Chatbot

1. **Reduce fricción:** Los usuarios no abandonan por confusión
2. **Mejora experiencia:** Guía clara y amigable
3. **Ahorra tiempo:** Respuestas instantáneas
4. **Disponibilidad 24/7:** Siempre disponible
5. **Escalable:** Atiende múltiples clientes simultáneamente
6. **Datos valiosos:** Insights sobre dudas comunes
7. **Diferencia competitiva:** Experiencia premium

---

## 📊 Métricas de Éxito

### KPIs a Medir

1. **Tasa de completación:** % de pre-coordinaciones completadas
2. **Tiempo promedio:** Tiempo para completar pre-coordinación
3. **Uso del chatbot:** % de usuarios que usan el chatbot
4. **Satisfacción:** Encuesta de satisfacción post-uso
5. **Reducción de consultas:** Menos preguntas al DJ/administrador
6. **Tasa de abandono:** Reducción en abandonos

### Objetivos

- **Tasa de completación:** +20% vs. sin chatbot
- **Tiempo promedio:** -30% vs. sin chatbot
- **Uso del chatbot:** >60% de usuarios
- **Satisfacción:** >4.5/5 estrellas

---

## 🔒 Consideraciones de Seguridad y Privacidad

### Datos del Usuario
- No almacenar conversaciones completas permanentemente
- Solo mantener contexto durante la sesión activa
- Cumplir con normativas de privacidad (GDPR, etc.)

### API Keys
- Almacenar en variables de entorno
- Nunca exponer en el frontend
- Rotar keys periódicamente

### Validación
- Validar todas las entradas del usuario
- Sanitizar respuestas antes de mostrar
- Limitar rate limiting para prevenir abuso

---

## 🧪 Testing y Validación

### Casos de Prueba

1. **Flujos básicos:**
   - Usuario completa pre-coordinación con ayuda del chatbot
   - Usuario hace preguntas frecuentes
   - Usuario solicita sugerencias

2. **Casos edge:**
   - Usuario escribe en otro idioma
   - Usuario hace preguntas fuera de contexto
   - Usuario abandona y regresa

3. **Integración:**
   - Chatbot completa campos correctamente
   - Sincronización con formulario
   - Persistencia de contexto

### Testing con Usuarios Reales

- Beta testing con 10-20 usuarios
- Recopilar feedback
- Iterar basado en feedback
- A/B testing: con vs. sin chatbot

---

## 📝 Próximos Pasos Inmediatos

### 1. Definir Casos de Uso Prioritarios
- Listar las 10 preguntas más frecuentes
- Identificar los pasos más confusos del formulario
- Definir flujos de conversación principales

### 2. Elegir Tecnología
- Decidir entre OpenAI, Dialogflow o híbrido
- Configurar cuenta y API keys
- Probar con casos de uso reales

### 3. Diseñar Flujos de Conversación
- Crear diagramas de flujo
- Escribir scripts de conversación
- Definir respuestas predefinidas

### 4. Crear Prototipo Básico
- Componente de chatbot simple
- Integración básica con formulario
- Pruebas internas

### 5. Probar con Usuarios Reales
- Beta testing
- Recopilar feedback
- Iterar y mejorar

---

## 📚 Recursos y Referencias

### Documentación
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Google Dialogflow Documentation](https://cloud.google.com/dialogflow/docs)
- [Best Practices for Chatbots](https://www.chatbot.com/chatbot-best-practices/)

### Ejemplos de Implementación
- [Chatbot con Next.js y OpenAI](https://github.com/vercel/ai-chatbot)
- [React Chatbot Components](https://github.com/LucasBassetti/react-simple-chatbot)

### Herramientas Útiles
- [Chatbot UI Libraries](https://github.com/topics/chatbot-ui)
- [Conversation Design Tools](https://www.landbot.io/)

---

## 🎯 Conclusión

El chatbot para pre-coordinación representa una mejora significativa en la experiencia del usuario, reduciendo fricción, mejorando la tasa de completación y proporcionando una experiencia más premium. La implementación por fases permite validar el concepto antes de invertir en funcionalidades avanzadas.

**Recomendación:** Comenzar con Fase 1 (MVP) para validar el concepto, luego iterar basado en feedback real de usuarios.

---

**Última actualización:** 2025-01-28  
**Próxima revisión:** Después de implementación de Fase 1

