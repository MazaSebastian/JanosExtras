# Configuración de OpenAI en Vercel

**Fecha:** 2025-01-28  
**Estado:** Listo para configurar

---

## 📋 Pasos para Agregar la API Key en Vercel

### 1. Acceder a Vercel Dashboard

1. Ve a: https://vercel.com
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: **SISTEMA EXTRAS JANOS** (o el nombre de tu proyecto)

### 2. Agregar Variable de Entorno

1. En el dashboard del proyecto, ve a **Settings** (Configuración)
2. En el menú lateral, haz clic en **Environment Variables** (Variables de Entorno)
3. Haz clic en **Add New** (Agregar Nueva)

### 3. Configurar la Variable

**Nombre de la variable:**
```
OPENAI_API_KEY
```

**Valor:**
```
sk-proj-tu_api_key_aqui
```
*(Reemplaza con tu API Key real de OpenAI)*

**Ambientes:**
- ✅ Production (Producción)
- ✅ Preview (Preview)
- ✅ Development (Desarrollo) - opcional

### 4. Guardar y Redesplegar

1. Haz clic en **Save** (Guardar)
2. Ve a **Deployments** (Despliegues)
3. Haz clic en los tres puntos (⋯) del último deployment
4. Selecciona **Redeploy** (Redesplegar)
5. O simplemente haz un nuevo commit y push (Vercel desplegará automáticamente)

---

## ✅ Verificación

Una vez configurado, el chatbot debería:

1. **Usar reglas simples** para preguntas comunes (rápido y barato)
2. **Usar OpenAI** para preguntas complejas o abiertas
3. **Funcionar automáticamente** sin necesidad de cambios en el código

---

## 🔍 Cómo Verificar que Funciona

### En los Logs de Vercel

1. Ve a **Deployments** → Último deployment → **Functions**
2. Busca el log de `/api/pre-coordinacion/chatbot`
3. Deberías ver: `✅ OpenAI inicializado correctamente`

### En el Chatbot

1. Haz una pregunta simple (ej: "¿Qué es el vals?")
   - Debería responder con reglas simples (rápido)

2. Haz una pregunta compleja (ej: "No sé qué tipo de música elegir para mi casamiento, tengo muchos invitados mayores")
   - Debería responder con OpenAI (más natural y contextual)

---

## 💰 Monitoreo de Costos

### Dashboard de OpenAI

1. Ve a: https://platform.openai.com/usage
2. Monitorea el uso diario
3. Configura alertas de gasto si es necesario

### Estimación de Costos

- **GPT-3.5-turbo:** ~$0.001-0.002 por conversación
- **100 conversaciones/mes:** ~$0.10-0.20
- **1000 conversaciones/mes:** ~$1-2

Con $5 cargados, tienes para aproximadamente **2,500-5,000 conversaciones**.

---

## ⚠️ Importante

- **NUNCA** expongas la API Key en el código
- **NUNCA** la subas a GitHub
- Solo úsala en variables de entorno (Vercel)
- Si necesitas rotarla, genera una nueva en OpenAI y actualiza en Vercel

---

## 🐛 Troubleshooting

### El chatbot no usa OpenAI

1. Verifica que la variable `OPENAI_API_KEY` esté configurada en Vercel
2. Verifica que el deployment sea reciente (después de agregar la variable)
3. Revisa los logs en Vercel para ver errores

### Error: "OpenAI no disponible"

1. Verifica que el paquete `openai` esté instalado: `npm list openai`
2. Verifica que la API Key sea válida
3. Revisa los logs para más detalles

### Costos muy altos

1. Revisa el dashboard de OpenAI para ver el uso
2. Considera agregar más reglas simples para preguntas frecuentes
3. Ajusta el prompt para respuestas más cortas

---

## 📝 Notas

- La implementación es **híbrida**: primero intenta reglas simples, luego OpenAI
- Esto reduce costos significativamente
- Las respuestas de reglas simples son más rápidas
- OpenAI se usa solo cuando es necesario

---

**¿Listo?** Una vez agregada la variable en Vercel y redesplegado, el chatbot con IA estará funcionando! 🚀

