# Verificar Configuración de OpenAI en Vercel

## 🔍 Problema Detectado

El log muestra:
```
⚠️ OPENAI_API_KEY no está configurada en variables de entorno
```

Esto significa que la variable de entorno no está disponible en el servidor.

## ✅ Pasos para Solucionar

### 1. Verificar Variable en Vercel

1. Ve a: https://vercel.com
2. Selecciona tu proyecto: **janos-extras**
3. Ve a **Settings** → **Environment Variables**
4. Busca `OPENAI_API_KEY`

**Verifica:**
- ✅ ¿Existe la variable?
- ✅ ¿El nombre es exactamente `OPENAI_API_KEY` (sin espacios, mayúsculas correctas)?
- ✅ ¿Está marcada para **Production**?
- ✅ ¿Está marcada para **Preview**?

### 2. Si NO Existe o Está Mal Configurada

**Agregar/Editar:**
1. Haz clic en **Add New** (o edita la existente)
2. **Key:** `OPENAI_API_KEY`
3. **Value:** `sk-proj-tu_api_key_aqui` (reemplaza con tu API Key real de OpenAI)
4. **Environments:** Marca ✅ Production y ✅ Preview
5. Haz clic en **Save**

### 3. REDEPLOY (MUY IMPORTANTE)

**Después de agregar/editar una variable de entorno, DEBES redesplegar:**

**Opción A: Redeploy Manual**
1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine (1-2 minutos)

**Opción B: Nuevo Commit (Recomendado)**
1. Haz un pequeño cambio en cualquier archivo
2. Commit y push
3. Vercel desplegará automáticamente con las nuevas variables

### 4. Verificar que Funciona

Después del redeploy:
1. Recarga la página de pre-coordinación
2. Abre el chatbot
3. Envía un mensaje como: "seguimos sin usar openai verdad?"
4. En la consola deberías ver:
   - `✅ OpenAI inicializado correctamente`
   - `[Chatbot Frontend] Fuente de respuesta: openai`

## 🐛 Troubleshooting

### Si después del redeploy sigue sin funcionar:

1. **Verifica el nombre de la variable:**
   - Debe ser exactamente: `OPENAI_API_KEY`
   - Sin espacios antes/después
   - Case-sensitive (mayúsculas/minúsculas importan)

2. **Verifica los ambientes:**
   - Si estás en producción, debe estar marcada para **Production**
   - Si estás en preview, debe estar marcada para **Preview**

3. **Verifica que el valor sea correcto:**
   - Copia y pega la API Key completa
   - No debe tener espacios ni saltos de línea

4. **Revisa los logs en Vercel:**
   - Ve a **Deployments** → Último deployment → **Functions**
   - Busca `/api/pre-coordinacion/chatbot`
   - Revisa los logs para ver si aparece el error

## 📝 Nota Importante

**Las variables de entorno solo se aplican en nuevos deployments.**

Si agregas una variable de entorno pero no redesplegas, el código seguirá sin tener acceso a ella.

---

**¿Necesitas ayuda?** Si después de seguir estos pasos sigue sin funcionar, comparte:
- Screenshot de la configuración de variables en Vercel
- Logs del deployment en Vercel
- Logs de la consola del navegador

