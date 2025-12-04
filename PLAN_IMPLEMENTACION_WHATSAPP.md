# Plan de Implementación: WhatsApp Business API con Twilio

## 📋 Resumen

Integración completa de WhatsApp Business API usando Twilio para:
- Icono flotante con notificaciones en tiempo real
- Chat completo (enviar y recibir mensajes)
- Integración con coordinaciones
- Historial de conversaciones

## 💰 Costos

- **Twilio**: $15.50 crédito inicial (gratis al registrarse)
- **WhatsApp Business API**: ~$0.005 por mensaje
- **Con 200 mensajes/mes**: ~$1/mes
- **Crédito inicial dura**: ~15 meses con ese uso

## 🔧 Requisitos Previos

1. ✅ Número de WhatsApp Business (ya lo tienes)
2. ⏳ Cuenta en Twilio
3. ⏳ Configurar WhatsApp Business en Twilio
4. ⏳ Obtener credenciales de Twilio

## 📦 Estructura de Implementación

### Fase 1: Configuración y Backend

#### 1.1 Variables de Entorno
```
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
TWILIO_WEBHOOK_URL=https://janosdjs.com/api/whatsapp/webhook
```

#### 1.2 Base de Datos
- Tabla `whatsapp_mensajes`:
  - id, coordinacion_id, from_number, to_number, body, direction, status, sent_at, read_at
- Tabla `whatsapp_conversaciones`:
  - id, coordinacion_id, phone_number, last_message_at, unread_count

#### 1.3 API Endpoints
- `POST /api/whatsapp/send` - Enviar mensaje
- `POST /api/whatsapp/webhook` - Recibir mensajes (webhook de Twilio)
- `GET /api/whatsapp/conversations` - Listar conversaciones
- `GET /api/whatsapp/conversations/:phone/messages` - Obtener mensajes de una conversación
- `GET /api/whatsapp/unread-count` - Contador de mensajes no leídos

### Fase 2: Frontend

#### 2.1 Componentes
- `WhatsAppFloatingButton.js` - Icono flotante con badge de notificaciones
- `WhatsAppChatPanel.js` - Panel lateral con lista de conversaciones
- `WhatsAppConversation.js` - Vista de conversación individual
- `WhatsAppMessage.js` - Componente de mensaje individual

#### 2.2 Integración
- Agregar botón de WhatsApp en cada coordinación
- Abrir chat directo desde coordinación
- Mostrar historial de mensajes por coordinación

### Fase 3: Notificaciones en Tiempo Real

- WebSocket o polling para actualizar contador
- Notificaciones push cuando llegan mensajes
- Actualización automática de conversaciones

## 🚀 Pasos de Implementación

### Paso 1: Configurar Twilio
1. Crear cuenta en [Twilio](https://www.twilio.com/)
2. Verificar número de WhatsApp Business
3. Obtener Account SID y Auth Token
4. Configurar webhook URL

### Paso 2: Backend
1. Instalar dependencias: `twilio`
2. Crear modelos de base de datos
3. Crear endpoints de API
4. Configurar webhook handler

### Paso 3: Frontend
1. Crear componentes de UI
2. Integrar con coordinaciones
3. Implementar sistema de notificaciones

### Paso 4: Testing
1. Probar envío de mensajes
2. Probar recepción de mensajes
3. Probar notificaciones en tiempo real

## 📝 Notas Importantes

- **Webhook de Twilio**: Debe ser HTTPS (Vercel lo proporciona)
- **Rate Limits**: Twilio tiene límites de velocidad
- **Formato de números**: Debe ser `whatsapp:+5491123456789` (con código de país)
- **Mensajes de plantilla**: Para iniciar conversaciones (primer mensaje)
- **Mensajes libres**: Después de que el usuario responde, puedes enviar mensajes libres por 24 horas

## 🔒 Seguridad

- Validar webhooks de Twilio (firma)
- Autenticación JWT para endpoints
- Sanitizar mensajes antes de guardar
- Rate limiting en endpoints

