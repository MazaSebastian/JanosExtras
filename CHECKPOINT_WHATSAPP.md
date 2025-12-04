# 📍 CHECKPOINT: Integración WhatsApp Business API

**Fecha del Checkpoint:** 4 de Diciembre, 2025  
**Estado:** Implementación completa, pendiente de pruebas end-to-end

---

## ✅ Lo que está COMPLETADO

### 1. Base de Datos
- ✅ Tablas creadas: `whatsapp_conversaciones` y `whatsapp_mensajes`
- ✅ Migraciones SQL ejecutadas en Supabase
- ✅ Índices y relaciones configuradas correctamente

### 2. Backend (API Routes)
- ✅ `/api/whatsapp/webhook` - Recibe mensajes entrantes de Twilio
- ✅ `/api/whatsapp/status` - Actualiza estado de mensajes (sent, delivered, read, failed)
- ✅ `/api/whatsapp/send` - Envía mensajes a través de Twilio
- ✅ `/api/whatsapp/conversations` - Lista conversaciones del DJ autenticado
- ✅ `/api/whatsapp/conversations/[phone]/messages` - Obtiene mensajes de una conversación
- ✅ `/api/whatsapp/unread-count` - Cuenta mensajes no leídos

### 3. Modelos de Datos
- ✅ `WhatsAppConversacion.js` - Modelo para conversaciones
  - `findOrCreate()` - Buscar o crear conversación
  - `findByDjId()` - Obtener conversaciones de un DJ
  - `findUnreadByDjId()` - Conversaciones con mensajes no leídos
  - `getUnreadCountByDj()` - Contador total de no leídos
  - `markAsRead()` - Marcar conversación como leída
  - `updateLastActivity()` - Actualizar última actividad

- ✅ `WhatsAppMensaje.js` - Modelo para mensajes
  - `create()` - Crear mensaje
  - `findByConversacion()` - Obtener mensajes de una conversación
  - `findByTwilioSid()` - Buscar mensaje por SID de Twilio
  - `updateStatus()` - Actualizar estado del mensaje

### 4. Frontend (Componentes React)
- ✅ `WhatsAppFloatingButton.js` - Botón flotante con contador de no leídos
- ✅ `WhatsAppChatPanel.js` - Panel principal de chat (lista de conversaciones)
- ✅ `WhatsAppConversation.js` - Vista de conversación individual
- ✅ `WhatsAppMessage.js` - Componente de mensaje individual (burbuja)
- ✅ Integración en `CoordinacionesPanel.js` - Botón WhatsApp abre panel interno

### 5. Servicios
- ✅ `whatsappAPI` en `api.js` - Cliente API para llamadas autenticadas
  - `send()` - Enviar mensaje
  - `getConversations()` - Obtener conversaciones
  - `getMessages()` - Obtener mensajes de una conversación
  - `getUnreadCount()` - Obtener contador de no leídos

### 6. Configuración Twilio
- ✅ Variables de entorno configuradas en Vercel:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_WHATSAPP_NUMBER`
- ✅ Webhooks configurados en Twilio Console:
  - "When a message comes in": `https://janosdjs.com/api/whatsapp/webhook`
  - "Status callback URL": `https://janosdjs.com/api/whatsapp/status`
- ✅ Número de WhatsApp Sandbox conectado: `+1 415 523 8886`
- ✅ Número de prueba conectado: `+5491130288564`

### 7. Documentación
- ✅ `GUIA_CONFIGURACION_TWILIO_WHATSAPP.md` - Guía completa de configuración
- ✅ `PLAN_IMPLEMENTACION_WHATSAPP.md` - Plan de implementación original

---

## ⚠️ Problemas Conocidos / Pendientes

### 1. Mensajes enviados desde Twilio Console no aparecen
**Problema:** Los mensajes enviados directamente desde la consola de Twilio no pasan por nuestro código, por lo que no se guardan en la base de datos.

**Solución temporal:** 
- Enviar mensajes desde la aplicación (funciona correctamente)
- O recibir mensajes del cliente (se guardan automáticamente vía webhook)

**Solución futura (opcional):**
- Crear endpoint que sincronice mensajes enviados desde Console
- O deshabilitar envío desde Console en producción

### 2. Normalización de números de teléfono
**Estado:** Mejorado recientemente, pero puede necesitar ajustes según casos reales.

**Lógica actual:**
- Normaliza números quitando espacios, guiones, paréntesis
- Agrega código de país 54 (Argentina) si falta
- Quita el prefijo "whatsapp:" y el "+"

**Próximos pasos:**
- Probar con números reales de coordinaciones
- Ajustar lógica si hay casos edge

### 3. Logging y debugging
**Estado:** Logging mejorado, pero puede necesitar más detalles en producción.

**Mejoras recientes:**
- Logs detallados en webhook
- Logs en frontend para debugging
- Logs en endpoints de envío

---

## 🧪 Pruebas Pendientes

### Pruebas Funcionales
- [ ] Enviar mensaje desde la aplicación a un número real
- [ ] Recibir mensaje del cliente y verificar que aparece en el panel
- [ ] Verificar que el contador de no leídos se actualiza correctamente
- [ ] Probar marcar conversación como leída
- [ ] Verificar que los mensajes se muestran en orden cronológico
- [ ] Probar con diferentes formatos de números de teléfono

### Pruebas de Integración
- [ ] Verificar que el webhook recibe mensajes correctamente (revisar logs de Vercel)
- [ ] Verificar que el webhook de status actualiza estados correctamente
- [ ] Probar con múltiples conversaciones simultáneas
- [ ] Verificar que el botón flotante muestra el contador correcto

### Pruebas de UI/UX
- [ ] Verificar diseño responsive en móvil
- [ ] Probar scroll en conversaciones largas
- [ ] Verificar que los mensajes se muestran correctamente (burbujas, timestamps)
- [ ] Probar búsqueda de conversaciones
- [ ] Verificar que el panel se cierra correctamente

---

## 📋 Próximos Pasos al Retomar

### 1. Verificar Estado Actual
```bash
# Verificar que las migraciones están aplicadas
# En Supabase: Verificar tablas whatsapp_conversaciones y whatsapp_mensajes

# Verificar variables de entorno en Vercel
# TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER

# Verificar webhooks en Twilio Console
# https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
```

### 2. Probar Funcionalidad Básica
1. Abrir la aplicación en `janosdjs.com/dashboard/coordinaciones`
2. Abrir consola del navegador (F12)
3. Hacer clic en el botón flotante de WhatsApp (esquina inferior derecha)
4. Verificar que se abre el panel (puede estar vacío inicialmente)
5. Seleccionar una coordinación con número de teléfono
6. Hacer clic en el botón WhatsApp de esa coordinación
7. Intentar enviar un mensaje de prueba
8. Verificar logs en consola del navegador

### 3. Probar Recepción de Mensajes
1. Desde WhatsApp personal, enviar mensaje al Sandbox: `+1 415 523 8886`
2. El mensaje debe contener el código del Sandbox (ej: "join flower-market")
3. Una vez conectado, enviar otro mensaje
4. Verificar que aparece en el panel de la aplicación
5. Revisar logs de Vercel para verificar que el webhook recibió el mensaje

### 4. Debugging si No Funciona
- **Revisar logs de Vercel:**
  - Ir a Vercel Dashboard → Proyecto → Functions → Logs
  - Buscar llamadas a `/api/whatsapp/*`
  - Verificar errores o warnings

- **Revisar consola del navegador:**
  - Abrir DevTools (F12)
  - Ir a la pestaña "Console"
  - Buscar logs que empiecen con 📋, ✅, ❌, ⚠️

- **Verificar base de datos:**
  - En Supabase, verificar que hay registros en `whatsapp_conversaciones`
  - Verificar que hay registros en `whatsapp_mensajes`
  - Comparar números de teléfono con los de las coordinaciones

### 5. Mejoras Futuras (Opcional)
- [ ] Sincronización bidireccional con WhatsApp Web
- [ ] Notificaciones push para nuevos mensajes
- [ ] Soporte para medios (imágenes, videos, documentos)
- [ ] Plantillas de mensajes predefinidas
- [ ] Respuestas automáticas (bot)
- [ ] Integración con coordinaciones para mensajes automáticos

---

## 🔧 Comandos Útiles

### Ver logs de Git
```bash
git log --oneline -10
```

### Verificar cambios pendientes
```bash
git status
```

### Verificar última versión desplegada
```bash
# Ver commits recientes
git log --oneline -5

# Verificar que está en main
git branch
```

### Revisar archivos modificados recientemente
```bash
# Archivos de WhatsApp
find . -name "*whatsapp*" -o -name "*WhatsApp*"
```

---

## 📁 Archivos Clave del Proyecto

### Backend
- `frontend/src/pages/api/whatsapp/webhook.js` - Webhook de recepción
- `frontend/src/pages/api/whatsapp/status.js` - Webhook de estado
- `frontend/src/pages/api/whatsapp/send.js` - Enviar mensajes
- `frontend/src/pages/api/whatsapp/conversations.js` - Listar conversaciones
- `frontend/src/pages/api/whatsapp/conversations/[phone]/messages.js` - Mensajes de conversación
- `frontend/src/pages/api/whatsapp/unread-count.js` - Contador no leídos

### Modelos
- `frontend/src/lib/models/WhatsAppConversacion.js` - Modelo de conversaciones
- `frontend/src/lib/models/WhatsAppMensaje.js` - Modelo de mensajes

### Frontend
- `frontend/src/components/WhatsAppFloatingButton.js` - Botón flotante
- `frontend/src/components/WhatsAppChatPanel.js` - Panel principal
- `frontend/src/components/WhatsAppConversation.js` - Vista de conversación
- `frontend/src/components/WhatsAppMessage.js` - Componente de mensaje
- `frontend/src/components/CoordinacionesPanel.js` - Integración principal

### Servicios
- `frontend/src/services/api.js` - Cliente API (incluye `whatsappAPI`)

### Base de Datos
- `database/create_whatsapp_tables.sql` - Script de creación de tablas

### Documentación
- `GUIA_CONFIGURACION_TWILIO_WHATSAPP.md` - Guía de configuración
- `PLAN_IMPLEMENTACION_WHATSAPP.md` - Plan de implementación

---

## 🔐 Credenciales y Configuración

### Variables de Entorno (Vercel)
- `TWILIO_ACCOUNT_SID` - Account SID de Twilio
- `TWILIO_AUTH_TOKEN` - Auth Token de Twilio
- `TWILIO_WHATSAPP_NUMBER` - Número de WhatsApp Sandbox: `whatsapp:+14155238886`

### Webhooks (Twilio Console)
- **When a message comes in:** `https://janosdjs.com/api/whatsapp/webhook`
- **Status callback URL:** `https://janosdjs.com/api/whatsapp/status`

### Números
- **Sandbox Number:** `+1 415 523 8886`
- **Número de prueba conectado:** `+5491130288564`

---

## 📝 Notas Adicionales

### Sobre el Sandbox de Twilio
- El Sandbox es para desarrollo y pruebas
- Tiene limitaciones (solo números pre-aprobados)
- Para producción, necesitarás un número de WhatsApp Business verificado
- El proceso de verificación puede tardar varios días

### Sobre los Webhooks
- Twilio llama al webhook cuando RECIBE un mensaje (inbound)
- El webhook de status se llama cuando cambia el estado de un mensaje ENVIADO
- Los mensajes enviados desde Twilio Console NO pasan por el webhook de recepción
- Los mensajes enviados desde la aplicación SÍ se guardan en la BD

### Sobre la Normalización de Números
- Los números se normalizan para comparación (quitar espacios, guiones, etc.)
- Se agrega código de país 54 (Argentina) si falta
- Se quita el prefijo "whatsapp:" y el "+"
- Puede necesitar ajustes según casos reales

---

## ✅ Checklist de Retorno

Cuando retomes el trabajo, verifica:

- [ ] Las tablas de WhatsApp existen en Supabase
- [ ] Las variables de entorno están configuradas en Vercel
- [ ] Los webhooks están configurados en Twilio Console
- [ ] El número de prueba está conectado al Sandbox
- [ ] La aplicación está desplegada y funcionando
- [ ] Puedes abrir el panel de WhatsApp en la aplicación
- [ ] Los logs de Vercel muestran actividad (o al menos no errores)

---

**Última actualización:** 4 de Diciembre, 2025  
**Último commit relevante:** `9dcb4fe` - "fix: Agregar endpoint webhook-status y mejorar documentación"

---

¡Éxito con el otro proyecto! 🚀

