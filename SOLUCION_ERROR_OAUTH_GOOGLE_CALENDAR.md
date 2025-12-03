# Solución: Error "OAuth client was not found" en Google Calendar

## 🔴 Problema

Cuando intentas conectar Google Calendar, aparece el error:
- **"The OAuth client was not found"**
- **Error 401: invalid_client**

Esto significa que el `GOOGLE_CLIENT_ID` configurado en Vercel no coincide con el registrado en Google Cloud Console.

## ✅ Solución Paso a Paso

### Paso 1: Verificar Credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (el que usaste para crear las credenciales)
3. Ve a **APIs & Services** → **Credentials**
4. Busca tu **OAuth 2.0 Client ID** (tipo "Web application")
5. Haz clic en el nombre del cliente para ver los detalles

### Paso 2: Verificar el CLIENT_ID

1. En la página de detalles del cliente, verás:
   - **Client ID**: Un string largo que empieza con números (ej: `1034269724972-3ondgskkfmg93...`)
   - **Client secret**: Un string que empieza con `GOCSPX-...`

2. **IMPORTANTE**: 
   - El CLIENT_ID debe ser **solo el string**, sin espacios, sin comillas, sin prefijos
   - Ejemplo correcto: `1034269724972-3ondgskkfmg93abc123def456.apps.googleusercontent.com`
   - ❌ Incorrecto: `"1034269724972-..."` (con comillas)
   - ❌ Incorrecto: `https://1034269724972-...` (con https://)

### Paso 3: Verificar Redirect URIs en Google Cloud Console

En la misma página de detalles del cliente, verifica que en **"Authorized redirect URIs"** esté configurado:

```
https://janosdjs.com/api/google-calendar/callback
```

**Si NO está**, agrégalo:
1. Haz clic en el botón de editar (lápiz) del cliente OAuth
2. En "Authorized redirect URIs", agrega: `https://janosdjs.com/api/google-calendar/callback`
3. Haz clic en **Save**

### Paso 4: Verificar Variables en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **janos-extras**
3. Ve a **Settings** → **Environment Variables**
4. Verifica que existan estas 3 variables:

   - `GOOGLE_CLIENT_ID` → Debe ser **exactamente** el Client ID de Google Cloud Console (sin comillas, sin espacios)
   - `GOOGLE_CLIENT_SECRET` → Debe ser **exactamente** el Client Secret de Google Cloud Console
   - `GOOGLE_REDIRECT_URI` → Debe ser: `https://janosdjs.com/api/google-calendar/callback`

### Paso 5: Corregir Variables en Vercel (si es necesario)

Si alguna variable está mal:

1. **Elimina** la variable incorrecta (haz clic en los 3 puntos → Delete)
2. **Agrega** la variable nuevamente:
   - **Name**: `GOOGLE_CLIENT_ID` (o el nombre correspondiente)
   - **Value**: Pega el valor **directamente desde Google Cloud Console** (sin espacios, sin comillas)
   - **Environment**: Selecciona **Production** (y Development si quieres)
   - Haz clic en **Save**

3. **Repite** para las otras variables si es necesario

### Paso 6: Redesplegar en Vercel

Después de cambiar las variables de entorno:

1. Ve a **Deployments** en Vercel
2. Haz clic en los 3 puntos del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine el despliegue

**O simplemente haz un commit vacío para forzar un nuevo deploy:**

```bash
git commit --allow-empty -m "Trigger redeploy after env vars update"
git push origin main
```

### Paso 7: Probar Nuevamente

1. Recarga la página de coordinaciones con hard refresh (`Cmd + Shift + R`)
2. Intenta conectar Google Calendar nuevamente
3. Deberías ser redirigido a Google para autorizar la aplicación

## 🔍 Verificación Adicional

Si el problema persiste, verifica:

### 1. Que el proyecto de Google Cloud Console esté activo
- Ve a Google Cloud Console → Dashboard
- Verifica que el proyecto esté seleccionado y activo

### 2. Que Google Calendar API esté habilitada
- Ve a **APIs & Services** → **Library**
- Busca "Google Calendar API"
- Verifica que esté **Enabled** (Habilitada)

### 3. Que el OAuth Consent Screen esté configurado
- Ve a **APIs & Services** → **OAuth consent screen**
- Verifica que esté en estado **Published** o al menos **Testing**
- Si está en "Testing", agrega tu email a "Test users"

### 4. Revisar los logs en Vercel
- Ve a **Deployments** → Selecciona el último deployment
- Haz clic en **Functions** → Busca `/api/google-calendar/auth`
- Revisa los logs para ver si hay errores adicionales

## 📝 Formato Correcto de Variables

**Ejemplo de variables correctas en Vercel:**

```
GOOGLE_CLIENT_ID=1034269724972-3ondgskkfmg93abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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45pq
GOOGLE_REDIRECT_URI=https://janosdjs.com/api/google-calendar/callback
```

**NOTA**: Los valores de arriba son ejemplos. Usa tus valores reales de Google Cloud Console.

## ⚠️ Errores Comunes

1. **Copiar con espacios al inicio/final**: Asegúrate de no tener espacios
2. **Incluir comillas**: No pongas comillas alrededor del valor
3. **Usar el ID del proyecto en lugar del Client ID**: Son diferentes
4. **Redirect URI incorrecto**: Debe ser exactamente `https://janosdjs.com/api/google-calendar/callback`
5. **Variables en el ambiente incorrecto**: Asegúrate de que estén en **Production**

## 🆘 Si Nada Funciona

1. Crea un **nuevo** OAuth Client ID en Google Cloud Console:
   - Ve a **APIs & Services** → **Credentials**
   - Haz clic en **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Tipo: **Web application**
   - Name: "Jano's DJ's Calendar Integration (Nuevo)"
   - Redirect URI: `https://janosdjs.com/api/google-calendar/callback`
   - Guarda y copia el nuevo Client ID y Secret
   - Actualiza las variables en Vercel con los nuevos valores

2. Verifica que el dominio `janosdjs.com` esté verificado en Google Cloud Console (si es necesario)

