# Guía de Configuración de Google Calendar

Esta guía te ayudará a configurar la integración con Google Calendar para agendar videollamadas desde las coordinaciones.

## 📋 Requisitos Previos

1. Una cuenta de Google (Gmail o Google Workspace)
2. Acceso a [Google Cloud Console](https://console.cloud.google.com/)
3. Base de datos PostgreSQL ejecutando las migraciones necesarias

## 🔧 Pasos de Configuración

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Anota el **ID del proyecto** (lo necesitarás más adelante)

### 2. Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs & Services** > **Library**
2. Busca "Google Calendar API"
3. Haz clic en **Enable** (Habilitar)

### 3. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Si es la primera vez, configura la **OAuth consent screen**:
   - **User Type**: External (para uso público) o Internal (solo para tu organización)
   - **App name**: "Jano's DJ's - Sistema de Coordinaciones"
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
   - **Scopes**: Agrega los siguientes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - **Save and Continue** hasta completar

4. Crea las credenciales OAuth:
   - **Application type**: Web application
   - **Name**: "Jano's DJ's Calendar Integration"
   - **Authorized redirect URIs**: Agrega las siguientes URLs:
     - Desarrollo: `http://localhost:3000/api/google-calendar/callback`
     - Producción: `https://janosdjs.com/api/google-calendar/callback` (o tu dominio)
   - Haz clic en **Create**

5. **IMPORTANTE**: Copia el **Client ID** y **Client Secret** (los necesitarás para las variables de entorno)

### 4. Configurar Variables de Entorno

Agrega las siguientes variables de entorno en tu archivo `.env.local` (desarrollo) y en Vercel (producción):

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

**Para producción en Vercel:**
- `GOOGLE_REDIRECT_URI` debe ser: `https://tu-dominio.com/api/google-calendar/callback`

### 5. Ejecutar Migraciones de Base de Datos en Supabase

Como estás usando Supabase, ejecuta las migraciones SQL directamente desde el SQL Editor:

1. **Abre Supabase** y ve a tu proyecto
2. En el menú lateral, haz clic en **"SQL Editor"** (ícono de terminal/código)
3. Haz clic en **"New query"**

#### Migración 1: Crear tabla de tokens de Google Calendar

1. Abre el archivo `database/create_google_calendar_tokens.sql` de este proyecto
2. **Copia TODO el contenido** del archivo
3. **Pega el contenido** en el editor SQL de Supabase
4. Haz clic en **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
5. ✅ Deberías ver un mensaje de éxito

#### Migración 2: Agregar campos a la tabla coordinaciones

1. Abre el archivo `database/add_google_calendar_fields_to_coordinaciones.sql` de este proyecto
2. **Copia TODO el contenido** del archivo
3. **Pega el contenido** en el editor SQL de Supabase
4. Haz clic en **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
5. ✅ Deberías ver un mensaje de éxito

**Nota**: Si alguna columna ya existe, verás un mensaje informativo pero no un error (gracias a `IF NOT EXISTS`).

## ✅ Verificación

### Verificar Migraciones en Supabase

1. En Supabase, ve a **"Table Editor"** (menú lateral)
2. Deberías ver la nueva tabla `google_calendar_tokens`
3. En la tabla `coordinaciones`, verifica que existan las nuevas columnas:
   - `google_calendar_event_id`
   - `videollamada_agendada`
   - `videollamada_fecha`
   - `videollamada_duracion`
   - `videollamada_meet_link`

### Verificar Funcionalidad en la Aplicación

1. Inicia sesión en la aplicación como DJ
2. Ve a la sección **Coordinaciones**
3. Deberías ver el componente **Google Calendar Connect** en la parte superior
4. Haz clic en **Conectar Google Calendar**
5. Se abrirá una ventana de Google para autorizar la aplicación
6. Después de autorizar, serás redirigido de vuelta a la aplicación
7. Deberías ver "✓ Conectado" en el componente

## 🎯 Uso

Una vez conectado Google Calendar:

1. En cualquier coordinación, verás un botón **📅** (o **📹** si ya hay una videollamada agendada)
2. Haz clic en el botón para abrir el modal de agendar videollamada
3. Completa:
   - **Fecha** de la videollamada
   - **Hora** de la videollamada
   - **Duración** (30 min, 1 hora, 1.5 horas, 2 horas)
   - **Descripción** (opcional)
4. Haz clic en **Agendar Videollamada**
5. El evento se creará en tu Google Calendar con:
   - Link de Google Meet automático
   - Recordatorios (24 horas antes y 1 hora antes)
   - Información de la coordinación en la descripción

## 🔒 Seguridad

- Los tokens de OAuth se almacenan de forma segura en la base de datos
- Los tokens se renuevan automáticamente cuando expiran
- Solo el DJ propietario puede agendar videollamadas en sus coordinaciones
- Los administradores pueden agendar videollamadas en cualquier coordinación

## 🐛 Solución de Problemas

### Error: "Google Calendar no está configurado"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` estén presentes

### Error: "redirect_uri_mismatch"
- Verifica que la URL en `GOOGLE_REDIRECT_URI` coincida exactamente con una de las URLs autorizadas en Google Cloud Console
- Asegúrate de que no haya espacios o caracteres extra

### Error: "invalid_client"
- Verifica que el `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
- Asegúrate de que la API de Google Calendar esté habilitada

### Error: "Error al refrescar token"
- El refresh token puede haber expirado o sido revocado
- Desconecta y vuelve a conectar Google Calendar

### La videollamada no se crea
- Verifica los logs del servidor para ver el error específico
- Asegúrate de que el DJ tenga Google Calendar conectado
- Verifica que la coordinación exista y pertenezca al DJ

## 📚 Recursos Adicionales

- [Documentación de Google Calendar API](https://developers.google.com/calendar/api)
- [Guía de OAuth 2.0 de Google](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🔄 Actualizaciones Futuras

Funcionalidades planeadas:
- Visualización del calendario del DJ en la aplicación
- Detección de conflictos de horarios
- Invitaciones automáticas por email a los clientes
- Sincronización bidireccional de eventos

