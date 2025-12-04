# Guía de Configuración: Twilio WhatsApp Business API

## 📋 Requisitos Previos

1. ✅ Número de WhatsApp Business (ya lo tienes)
2. ⏳ Cuenta en Twilio (gratis con $15.50 de crédito)
3. ⏳ Número de teléfono verificado en Twilio

## 🔧 Paso 1: Crear Cuenta en Twilio

1. Ve a [Twilio](https://www.twilio.com/)
2. Haz clic en **"Sign up"** (Registrarse)
3. Completa el formulario de registro
4. Verifica tu email
5. **¡Obtendrás $15.50 de crédito gratis!** 🎉

## 🔧 Paso 2: Verificar Número de WhatsApp Business

1. En el Dashboard de Twilio, ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
2. O ve directamente a: [Twilio Console - Messaging](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
3. Sigue las instrucciones para verificar tu número de WhatsApp Business
4. **IMPORTANTE**: Este proceso puede tardar unos minutos o días dependiendo de la verificación

## 🔧 Paso 3: Obtener Credenciales

1. En el Dashboard de Twilio, ve a **Settings** → **General**
2. Copia:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (haz clic en "View" para verlo)

## 🔧 Paso 4: Configurar Variables de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **janos-extras**
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

```
TWILIO_ACCOUNT_SID=tu_account_sid_aqui
TWILIO_AUTH_TOKEN=tu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

**IMPORTANTE**:
- `TWILIO_WHATSAPP_NUMBER` debe estar en formato: `whatsapp:+5491123456789`
- Reemplaza `+1234567890` con tu número real de WhatsApp Business
- El formato debe incluir el código de país (ej: +54 para Argentina)

## 🔧 Paso 5: Configurar Webhook URL

1. En Twilio Console, ve a **Messaging** → **Settings** → **WhatsApp Sandbox** (o **WhatsApp Business** si ya está verificado)
2. En **"A MESSAGE COMES IN"**, configura:
   ```
   https://janosdjs.com/api/whatsapp/webhook
   ```
3. En **"STATUS CALLBACK URL"**, configura:
   ```
   https://janosdjs.com/api/whatsapp/status
   ```
4. Guarda los cambios

## 🔧 Paso 6: Ejecutar Migraciones SQL en Supabase

1. Abre [Supabase](https://supabase.com) y ve a tu proyecto
2. Ve a **SQL Editor**
3. Abre el archivo `database/create_whatsapp_tables.sql`
4. Copia TODO el contenido
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
7. ✅ Deberías ver un mensaje de éxito

## ✅ Verificación

### Verificar que las tablas se crearon:

1. En Supabase, ve a **Table Editor**
2. Deberías ver las nuevas tablas:
   - `whatsapp_conversaciones`
   - `whatsapp_mensajes`

### Verificar variables de entorno:

1. En Vercel, verifica que las 3 variables estén configuradas
2. Asegúrate de que estén en **Production** (y Development si quieres)

## 🧪 Prueba Rápida

Una vez configurado todo, puedes probar enviando un mensaje desde la aplicación. El sistema:
1. Enviará el mensaje a través de Twilio
2. Guardará el mensaje en la base de datos
3. Mostrará el mensaje en el chat

## ⚠️ Notas Importantes

### Formato de Números

- **Debe incluir código de país**: `+5491123456789` (no `91123456789`)
- **Formato Twilio**: `whatsapp:+5491123456789`
- **Argentina**: Código de país es `+54`

### Mensajes de Plantilla vs Mensajes Libres

- **Primer mensaje**: Debe ser una plantilla aprobada por WhatsApp
- **Después de respuesta**: Puedes enviar mensajes libres por 24 horas
- **Plantillas**: Se configuran en Twilio Console → Messaging → Content Templates

### Costos

- **Crédito inicial**: $15.50 (gratis)
- **Por mensaje**: ~$0.005
- **Con 200 mensajes/mes**: ~$1/mes
- **Crédito dura**: ~15 meses con ese uso

## 🆘 Problemas Comunes

### Error: "The number provided is not a valid WhatsApp number"
- Verifica que el número esté en formato: `whatsapp:+5491123456789`
- Asegúrate de que el número esté verificado en Twilio

### Error: "Message template not found"
- Necesitas crear una plantilla en Twilio Console
- O usar una plantilla existente

### Error: "Webhook URL not accessible"
- Verifica que la URL sea HTTPS
- Verifica que el endpoint `/api/whatsapp/webhook` esté desplegado

## 📝 Próximos Pasos

Una vez configurado Twilio:
1. ✅ Ejecutar migraciones SQL
2. ⏳ Configurar variables de entorno
3. ⏳ Probar envío de mensajes
4. ⏳ Probar recepción de mensajes

