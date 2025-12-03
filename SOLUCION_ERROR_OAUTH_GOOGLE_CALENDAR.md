# Solución: Errores OAuth en Google Calendar

## 🔴 Problemas Comunes

### Error 1: "OAuth client was not found" (Error 401: invalid_client)

Cuando intentas conectar Google Calendar, aparece el error:
- **"The OAuth client was not found"**
- **Error 401: invalid_client**

Esto significa que el `GOOGLE_CLIENT_ID` configurado en Vercel no coincide con el registrado en Google Cloud Console.

### Error 2: "Acceso bloqueado" (Error 403: access_denied) ⭐ **TU CASO ACTUAL**

Cuando intentas conectar Google Calendar, aparece el error:
- **"Acceso bloqueado: janosdjs.com no completó el proceso de verificación de Google"**
- **"La app se está probando y solo los verificadores aprobados por los desarrolladores pueden acceder a ella"**
- **Error 403: access_denied**

Esto significa que:
- ✅ El CLIENT_ID es correcto (Google lo reconoce)
- ❌ La aplicación está en modo **"Testing"** y tu cuenta no está en la lista de usuarios de prueba
- O la aplicación necesita ser verificada por Google para uso en producción

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

## ✅ Solución para Error 403: access_denied (TU CASO)

Este es el error que estás viendo ahora. Tienes dos opciones:

### Opción 1: Agregar Usuarios de Prueba (Rápido - Recomendado para empezar)

Si la aplicación está en modo **"Testing"**, necesitas agregar tu cuenta de Google como usuario de prueba:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **OAuth consent screen**
4. En la sección **"Test users"**, haz clic en **"+ ADD USERS"**
5. Agrega tu email de Google (el que usas para iniciar sesión):
   - `djsebamaza@gmail.com` (o el email que estés usando)
   - Puedes agregar múltiples emails separados por comas
6. Haz clic en **"ADD"**
7. Espera unos segundos y vuelve a intentar conectar Google Calendar

**Nota**: Si agregas más usuarios que necesiten usar la app, agrégalos también aquí.

### Opción 2: Publicar la Aplicación (Para uso en producción)

Si quieres que cualquier usuario pueda usar la aplicación sin agregarlos manualmente:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **OAuth consent screen**
4. En la parte superior, verás el estado actual (probablemente "Testing")
5. Haz clic en **"PUBLISH APP"** (Publicar aplicación)
6. Confirma la acción

**⚠️ IMPORTANTE**: Para publicar la aplicación, Google puede requerir:
- Verificación del dominio `janosdjs.com`
- Información adicional sobre la aplicación
- Revisión de Google (puede tomar varios días)

**Para uso interno/privado**, es mejor usar la **Opción 1** (usuarios de prueba).

### Verificar el Estado Actual

Para ver en qué modo está tu aplicación:

1. Ve a **APIs & Services** → **OAuth consent screen**
2. En la parte superior verás:
   - **"Testing"** → Solo usuarios de prueba pueden acceder
   - **"In production"** → Cualquier usuario puede acceder (requiere verificación)

## 🆘 Si Nada Funciona

1. Crea un **nuevo** OAuth Client ID en Google Cloud Console:
   - Ve a **APIs & Services** → **Credentials**
   - Haz clic en **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Tipo: **Web application**
   - Name: "Jano's DJ's Calendar Integration (Nuevo)"
   - Redirect URI: `https://janosdjs.com/api/google-calendar/callback`
   - Guarda y copia el nuevo Client ID y Secret
   - Actualiza las variables en Vercel con los nuevos valores
   - **NO OLVIDES**: Agregar tu email como usuario de prueba en OAuth consent screen

2. Verifica que el dominio `janosdjs.com` esté verificado en Google Cloud Console (si es necesario)

