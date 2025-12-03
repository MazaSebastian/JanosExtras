# Guía Paso a Paso: Configurar Google Cloud Console para Google Calendar

## 📍 Situación Actual

Estás en la página **"OAuth Overview"** del proyecto **"Janos DJ's"** en Google Cloud Console. Perfecto, estás en el lugar correcto.

## 🎯 Objetivo

Necesitamos:
1. ✅ Configurar el OAuth Consent Screen (pantalla de consentimiento)
2. ✅ Crear un OAuth Client (credenciales)
3. ✅ Obtener el Client ID y Client Secret

---

## PASO 1: Configurar OAuth Consent Screen

**Antes de crear el OAuth client, necesitamos configurar la pantalla de consentimiento.**

### 1.1. Ir a la configuración del Consent Screen

1. En el menú lateral izquierdo, busca y haz clic en **"Branding"** o **"Audience"**
   - Si no ves estas opciones, busca en el menú lateral una opción que diga algo como **"OAuth consent screen"** o **"Consent Screen"**
   - También puedes buscar en la barra de búsqueda superior: escribe "OAuth consent screen"

2. O directamente, haz clic en el botón **"Create OAuth client"** que ves en la pantalla
   - Si te pide configurar el consent screen primero, te llevará automáticamente

### 1.2. Configurar el Consent Screen

Cuando llegues a la página de OAuth Consent Screen:

1. **User Type** (Tipo de Usuario):
   - Selecciona **"External"** (para que cualquier usuario de Google pueda autorizar)
   - Haz clic en **"Create"**

2. **App Information** (Información de la App):
   - **App name**: `Jano's DJ's - Sistema de Coordinaciones`
   - **User support email**: Selecciona tu email de la lista desplegable
   - **App logo**: (Opcional) Puedes dejarlo vacío por ahora
   - **App domain**: (Opcional) Puedes dejarlo vacío
   - **Application home page**: `https://tu-dominio.com` (o `https://janosdjs.com` si ese es tu dominio)
   - **Application privacy policy link**: (Opcional) Puedes dejarlo vacío
   - **Application terms of service link**: (Opcional) Puedes dejarlo vacío
   - **Authorized domains**: (Opcional) Puedes dejarlo vacío
   - Haz clic en **"Save and Continue"**

3. **Scopes** (Permisos):
   
   **Opción A - Si ves la sección de Scopes:**
   - Haz clic en **"Add or Remove Scopes"** o **"Scopes"**
   - En la lista, busca y marca estos dos:
     - ✅ `https://www.googleapis.com/auth/calendar`
     - ✅ `https://www.googleapis.com/auth/calendar.events`
   - Haz clic en **"Update"** o **"Save"**
   - Haz clic en **"Save and Continue"**
   
   **Opción B - Si NO ves la sección de Scopes:**
   - **No te preocupes**, los scopes se configurarán automáticamente cuando crees el OAuth client
   - Simplemente haz clic en **"Save and Continue"** o **"Back to Dashboard"**
   - Continuaremos con el siguiente paso

4. **Test users** (Usuarios de prueba):
   - Si seleccionaste "External", puedes agregar usuarios de prueba aquí
   - Por ahora, puedes saltar este paso haciendo clic en **"Save and Continue"**

5. **Summary** (Resumen):
   - Revisa la información
   - Haz clic en **"Back to Dashboard"** o simplemente continúa

---

## PASO 2: Habilitar Google Calendar API

**Antes de crear el OAuth client, necesitamos habilitar la API de Google Calendar.**

### 2.1. Ir a la página de APIs

1. En la barra de búsqueda superior (donde dice "Search (/) for resources..."), escribe: **"Calendar API"**
2. O ve al menú lateral (☰) → **"APIs & Services"** → **"Library"**

### 2.2. Habilitar la API

1. En la barra de búsqueda de la página "API Library", escribe: **"Google Calendar API"**
2. Haz clic en el resultado **"Google Calendar API"**
3. Haz clic en el botón **"Enable"** (Habilitar)
4. Espera unos segundos hasta que veas un mensaje de confirmación

---

## PASO 3: Crear OAuth Client (Credenciales)

### 3.1. Ir a Credentials (Credenciales)

1. En el menú lateral, ve a **"APIs & Services"** → **"Credentials"**
   - O busca "Credentials" en la barra de búsqueda superior

### 3.2. Crear OAuth Client ID

1. En la parte superior de la página, haz clic en **"+ CREATE CREDENTIALS"**
2. Selecciona **"OAuth client ID"** del menú desplegable

3. Si es la primera vez, te pedirá configurar el Consent Screen:
   - Si ya lo configuraste en el Paso 1, selecciona tu app y continúa
   - Si no, te llevará a configurarlo (sigue el Paso 1)

4. **Application type** (Tipo de aplicación):
   - Selecciona **"Web application"**

5. **Name** (Nombre):
   - Escribe: `Jano's DJ's Calendar Integration`

6. **Authorized redirect URIs** (URIs de redirección autorizadas):
   - Haz clic en **"+ ADD URI"**
   - Agrega estas dos URLs (una por una):
     
     **Para desarrollo local:**
     ```
     http://localhost:3000/api/google-calendar/callback
     ```
     
     **Para producción (reemplaza con tu dominio real):**
     ```
     https://tu-dominio.com/api/google-calendar/callback
     ```
     - Si tu dominio es `janosdjs.com`, sería:
     ```
     https://janosdjs.com/api/google-calendar/callback
     ```
   
   - ⚠️ **IMPORTANTE**: Asegúrate de escribir exactamente estas URLs, sin espacios ni caracteres extra

7. Haz clic en **"Create"** (Crear)

### 3.3. Copiar las Credenciales

**¡IMPORTANTE!** Esta es la única vez que verás el Client Secret completo.

1. Se abrirá un pop-up con tus credenciales:
   - **Your Client ID**: (algo como `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Your Client Secret**: (algo como `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

2. **COPIA AMBOS VALORES INMEDIATAMENTE**:
   - Haz clic en el ícono de copiar (📋) al lado de cada valor
   - O selecciona y copia manualmente (Cmd+C en Mac)
   - **Guárdalos en un lugar seguro** (un archivo de texto, notas, etc.)

3. Haz clic en **"OK"** para cerrar el pop-up

---

## PASO 4: Configurar Variables de Entorno en Vercel

### 4.1. Obtener tu Dominio de Producción

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Selecciona tu proyecto
3. Ve a **"Settings"** → **"Domains"**
4. Copia tu dominio de producción (algo como `janos-extras.vercel.app` o tu dominio personalizado)

### 4.2. Agregar Variables de Entorno

1. En Vercel, ve a **"Settings"** → **"Environment Variables"**

2. Agrega las siguientes variables (una por una):

   **Variable 1:**
   - **Name**: `GOOGLE_CLIENT_ID`
   - **Value**: Pega el Client ID que copiaste en el Paso 3.3
   - **Environment**: Selecciona todas (Production, Preview, Development)
   - Haz clic en **"Save"**

   **Variable 2:**
   - **Name**: `GOOGLE_CLIENT_SECRET`
   - **Value**: Pega el Client Secret que copiaste en el Paso 3.3
   - **Environment**: Selecciona todas (Production, Preview, Development)
   - Haz clic en **"Save"**

   **Variable 3:**
   - **Name**: `GOOGLE_REDIRECT_URI`
   - **Value**: `https://tu-dominio.com/api/google-calendar/callback`
     - Reemplaza `tu-dominio.com` con tu dominio real de Vercel
     - Ejemplo: `https://janos-extras.vercel.app/api/google-calendar/callback`
   - **Environment**: Selecciona todas (Production, Preview, Development)
   - Haz clic en **"Save"**

### 4.3. Verificar que las Variables Estén Configuradas

Deberías ver 3 variables en la lista:
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `GOOGLE_REDIRECT_URI`

---

## PASO 5: Redesplegar la Aplicación

1. En Vercel, ve a **"Deployments"**
2. Encuentra el último deployment
3. Haz clic en los **3 puntos** (⋯) a la derecha
4. Selecciona **"Redeploy"**
5. Confirma el redespliegue

O simplemente haz un commit y push:
```bash
git commit --allow-empty -m "Trigger redeploy for Google Calendar"
git push
```

---

## PASO 6: Probar la Integración

1. Espera a que termine el despliegue en Vercel (2-3 minutos)
2. Ve a tu aplicación en producción
3. Inicia sesión como DJ
4. Ve a la sección **"Coordinaciones"**
5. Deberías ver el componente **"Google Calendar Connect"** en la parte superior
6. Haz clic en **"Conectar Google Calendar"**
7. Se abrirá una ventana de Google pidiendo autorización
8. Revisa los permisos y haz clic en **"Permitir"** o **"Allow"**
9. Serás redirigido de vuelta a la aplicación
10. Deberías ver **"✓ Conectado"** en el componente

---

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa**: La URL en `GOOGLE_REDIRECT_URI` no coincide exactamente con las URLs autorizadas en Google Cloud Console.

**Solución**:
1. Ve a Google Cloud Console → APIs & Services → Credentials
2. Haz clic en tu OAuth Client ID
3. Verifica que la URL en "Authorized redirect URIs" sea **exactamente igual** a la de `GOOGLE_REDIRECT_URI` en Vercel
4. Asegúrate de que no haya espacios, mayúsculas/minúsculas diferentes, o caracteres extra

### Error: "invalid_client"

**Causa**: El Client ID o Client Secret son incorrectos.

**Solución**:
1. Verifica que copiaste correctamente el Client ID y Client Secret
2. Asegúrate de que las variables de entorno en Vercel tengan los valores correctos
3. Si perdiste el Client Secret, tendrás que crear un nuevo OAuth Client

### Error: "access_denied" al autorizar

**Causa**: El Consent Screen no está configurado correctamente o la app está en modo de prueba.

**Solución**:
1. Ve a OAuth Consent Screen en Google Cloud Console
2. Verifica que los scopes estén configurados
3. Si la app está en "Testing", agrega tu email como test user

### No veo el componente "Google Calendar Connect"

**Causa**: Las variables de entorno no están configuradas o la aplicación no se redesplegó.

**Solución**:
1. Verifica que las 3 variables de entorno estén en Vercel
2. Asegúrate de haber redesplegado después de agregar las variables
3. Revisa los logs de Vercel para ver si hay errores

---

## ✅ Checklist Final

Antes de considerar que todo está listo, verifica:

- [ ] OAuth Consent Screen configurado
- [ ] Google Calendar API habilitada
- [ ] OAuth Client creado con redirect URIs correctos
- [ ] Client ID y Client Secret copiados y guardados
- [ ] 3 variables de entorno configuradas en Vercel
- [ ] Aplicación redesplegada en Vercel
- [ ] Puedes conectar Google Calendar desde la aplicación
- [ ] Puedes agendar una videollamada desde una coordinación

---

## 📞 ¿Necesitas Ayuda?

Si te quedas atascado en algún paso:
1. Toma una captura de pantalla de donde estás
2. Anota el mensaje de error exacto (si hay alguno)
3. Indica en qué paso te quedaste

¡Estoy aquí para ayudarte! 🚀

