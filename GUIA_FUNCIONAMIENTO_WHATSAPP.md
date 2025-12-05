# 📱 Guía Detallada: Funcionamiento del Sistema WhatsApp

## 🎯 Resumen Ejecutivo

**Sí, puedes revisar desde la app cuando tengas mensajes no leídos de clientes.** El sistema funciona de la siguiente manera:

1. **Cliente envía mensaje** → Twilio recibe → Webhook guarda en BD → Contador se actualiza
2. **Tú ves el badge** con el número de no leídos en el botón flotante
3. **Abres el panel** → Ves todas tus conversaciones con mensajes no leídos destacados
4. **Respondes desde la app** → El mensaje se envía por Twilio → Se guarda en BD

---

## 📋 Flujo Completo Paso a Paso

### 1️⃣ **RECEPCIÓN DE MENSAJES (Cliente → App)**

#### Paso 1: Cliente envía mensaje
- El cliente envía un mensaje de WhatsApp al número de Twilio (Sandbox: `+1 415 523 8886`)
- El mensaje debe contener el código del Sandbox si es la primera vez (ej: "join flower-market")

#### Paso 2: Twilio recibe el mensaje
- Twilio recibe el mensaje y lo envía a tu webhook: `https://janosdjs.com/api/whatsapp/webhook`
- Twilio envía los datos del mensaje (número, texto, SID, etc.)

#### Paso 3: Webhook procesa el mensaje
```
/api/whatsapp/webhook recibe:
- From: Número del cliente (ej: +5491123456789)
- Body: Texto del mensaje
- MessageSid: ID único del mensaje
```

**Lo que hace el webhook:**
1. **Normaliza el número** del cliente (quita espacios, guiones, etc.)
2. **Busca la coordinación** asociada a ese número de teléfono
3. **Crea o encuentra la conversación** en la BD
4. **Guarda el mensaje** en `whatsapp_mensajes` con:
   - `direction: 'inbound'` (mensaje recibido)
   - `status: 'delivered'`
   - `unread_count: +1` (incrementa el contador)
5. **Actualiza la conversación** con:
   - `last_message_at`: Fecha/hora del mensaje
   - `last_message_preview`: Primeros 100 caracteres
   - `unread_count`: Se incrementa en 1

#### Paso 4: Base de datos actualizada
- El mensaje queda guardado en `whatsapp_mensajes`
- La conversación queda actualizada en `whatsapp_conversaciones`
- El contador `unread_count` aumenta

---

### 2️⃣ **VISUALIZACIÓN DE MENSAJES NO LEÍDOS (App → Tú)**

#### Paso 1: Botón flotante se carga
- El componente `WhatsAppFloatingButton` se monta en la página de Coordinaciones
- Inmediatamente llama a `/api/whatsapp/unread-count`

#### Paso 2: Endpoint calcula no leídos
```
GET /api/whatsapp/unread-count
```
**Lo que hace:**
1. Obtiene tu ID de usuario (DJ)
2. Busca todas las conversaciones de tus coordinaciones
3. Suma todos los `unread_count` de esas conversaciones
4. Retorna: `{ count: 5 }` (ejemplo: 5 mensajes no leídos)

#### Paso 3: Badge se muestra
- Si `count > 0`, aparece un **badge rojo** con el número
- El badge muestra "99+" si hay más de 99 mensajes
- El badge se actualiza **cada 30 segundos** automáticamente

#### Paso 4: Abres el panel
- Haces clic en el botón flotante de WhatsApp
- Se abre `WhatsAppChatPanel`

#### Paso 5: Panel carga conversaciones
```
GET /api/whatsapp/conversations
```
**Lo que hace:**
1. Busca todas las conversaciones de tus coordinaciones
2. Ordena por `last_message_at` (más recientes primero)
3. Retorna lista con:
   - Nombre del cliente
   - Título de la coordinación
   - Preview del último mensaje
   - **Número de no leídos** (`unread_count`)
   - Fecha/hora del último mensaje

#### Paso 6: Conversaciones se muestran
- Las conversaciones con `unread_count > 0` aparecen **destacadas**
- Cada conversación muestra:
  - Badge con número de no leídos
  - Preview del último mensaje
  - Nombre del cliente o título de coordinación

---

### 3️⃣ **LECTURA DE MENSAJES (Tú → App)**

#### Paso 1: Abres una conversación
- Haces clic en una conversación de la lista
- Se abre `WhatsAppConversation`

#### Paso 2: Se cargan los mensajes
```
GET /api/whatsapp/conversations/[phone]/messages
```
**Lo que hace:**
1. Busca la conversación por número de teléfono
2. Obtiene todos los mensajes de esa conversación
3. **Marca la conversación como leída** (`unread_count = 0`)
4. Retorna los mensajes ordenados cronológicamente

#### Paso 3: Mensajes se muestran
- Los mensajes aparecen en burbujas:
  - **Verde**: Mensajes que TÚ enviaste (outbound)
  - **Gris**: Mensajes que recibiste (inbound)
- Cada mensaje muestra:
  - Texto del mensaje
  - Fecha/hora
  - Estado (sent, delivered, read)

#### Paso 4: Contador se actualiza
- Al marcar como leída, el contador del badge flotante se actualiza
- El panel de conversaciones se actualiza (ya no aparece destacada)

---

### 4️⃣ **ENVÍO DE MENSAJES (Tú → Cliente)**

#### Paso 1: Escribes un mensaje
- En la vista de conversación, escribes el texto
- Haces clic en enviar (📤)

#### Paso 2: Se envía a Twilio
```
POST /api/whatsapp/send
Body: {
  coordinacion_id: 123,
  message: "Hola, ¿cómo estás?",
  to_phone_number: "5491123456789" // opcional
}
```
**Lo que hace:**
1. Valida que tengas permiso (coordinación es tuya)
2. Normaliza el número de teléfono
3. Envía el mensaje a Twilio
4. Twilio envía el mensaje al cliente por WhatsApp

#### Paso 3: Se guarda en BD
- Crea o encuentra la conversación
- Guarda el mensaje con:
  - `direction: 'outbound'` (mensaje enviado)
  - `status: 'sent'` (o el estado que retorna Twilio)
- Actualiza `last_message_at` y `last_message_preview`

#### Paso 4: Se actualiza la vista
- El mensaje aparece inmediatamente en la conversación
- Los mensajes se recargan automáticamente cada 5 segundos

#### Paso 5: Webhook de status actualiza estado
- Twilio envía actualizaciones de estado a `/api/whatsapp/status`
- Cuando el cliente lee el mensaje, se actualiza a `status: 'read'`

---

## 🔄 Actualizaciones Automáticas

### Contador de No Leídos
- **Frecuencia**: Cada 30 segundos
- **Componente**: `WhatsAppFloatingButton`
- **Endpoint**: `/api/whatsapp/unread-count`

### Lista de Conversaciones
- **Frecuencia**: Cada 10 segundos (cuando el panel está abierto)
- **Componente**: `WhatsAppChatPanel`
- **Endpoint**: `/api/whatsapp/conversations`

### Mensajes de una Conversación
- **Frecuencia**: Cada 5 segundos (cuando la conversación está abierta)
- **Componente**: `WhatsAppConversation`
- **Endpoint**: `/api/whatsapp/conversations/[phone]/messages`

---

## 📊 Estructura de Datos

### Tabla: `whatsapp_conversaciones`
```sql
- id: ID único
- coordinacion_id: ID de la coordinación asociada
- phone_number: Número de teléfono del cliente
- contact_name: Nombre del contacto (si está disponible)
- last_message_at: Fecha/hora del último mensaje
- last_message_preview: Preview del último mensaje (100 caracteres)
- unread_count: Número de mensajes no leídos
- created_at, updated_at: Timestamps
```

### Tabla: `whatsapp_mensajes`
```sql
- id: ID único
- conversacion_id: ID de la conversación
- coordinacion_id: ID de la coordinación
- twilio_message_sid: SID del mensaje de Twilio
- from_number: Número que envía
- to_number: Número que recibe
- body: Texto del mensaje
- direction: 'inbound' (recibido) o 'outbound' (enviado)
- status: 'sent', 'delivered', 'read', 'failed'
- media_url: URL de medios (imágenes, videos, etc.)
- sent_at, delivered_at, read_at: Timestamps
```

---

## 🎨 Interfaz de Usuario

### Botón Flotante
- **Ubicación**: Esquina inferior derecha
- **Color**: Verde (WhatsApp)
- **Badge**: Rojo con número (si hay no leídos)
- **Acción**: Abre el panel de conversaciones

### Panel de Conversaciones
- **Vista de lista**: Todas tus conversaciones
- **Búsqueda**: Filtrar por nombre, teléfono o título
- **Destacadas**: Conversaciones con no leídos aparecen resaltadas
- **Badge**: Número de no leídos por conversación

### Vista de Conversación
- **Header**: Nombre del cliente, título de coordinación
- **Mensajes**: Burbujas de chat (verde/gris)
- **Input**: Campo de texto para escribir
- **Botón enviar**: 📤

---

## ⚠️ Limitaciones Actuales

### Sandbox de Twilio
- Solo funciona con números pre-aprobados en el Sandbox
- Para producción, necesitas un número de WhatsApp Business verificado
- El proceso de verificación puede tardar varios días

### Mensajes sin Coordinación
- Si un cliente envía mensaje pero no tiene coordinación asociada, el mensaje **no se guarda**
- El webhook responde con un mensaje automático pidiendo que contacte directamente

### Medios (Imágenes, Videos)
- El sistema guarda la URL del medio, pero **no muestra previews** en la interfaz
- Solo se muestra el texto del mensaje

---

## ✅ Checklist de Funcionamiento

Para verificar que todo funciona:

- [ ] **Webhook configurado** en Twilio Console
- [ ] **Variables de entorno** configuradas en Vercel
- [ ] **Tablas creadas** en Supabase
- [ ] **Botón flotante visible** en Coordinaciones
- [ ] **Contador se actualiza** cada 30 segundos
- [ ] **Panel se abre** al hacer clic
- [ ] **Conversaciones se cargan** correctamente
- [ ] **Mensajes se muestran** en orden cronológico
- [ ] **Envío funciona** y mensajes aparecen inmediatamente
- [ ] **Recepción funciona** y mensajes aparecen en el panel

---

## 🐛 Troubleshooting

### No aparecen conversaciones
1. Verifica que hay mensajes en la BD: `SELECT * FROM whatsapp_mensajes`
2. Verifica que las coordinaciones tienen `dj_responsable_id` correcto
3. Revisa los logs de Vercel para errores

### Contador no se actualiza
1. Verifica que el endpoint `/api/whatsapp/unread-count` funciona
2. Revisa la consola del navegador para errores
3. Verifica que `unread_count` > 0 en la BD

### Mensajes no se envían
1. Verifica que el número está en el Sandbox de Twilio
2. Revisa los logs de Vercel para errores de Twilio
3. Verifica que las variables de entorno están configuradas

---

## 📝 Notas Importantes

1. **El contador se actualiza automáticamente**, pero puede tardar hasta 30 segundos
2. **Los mensajes se actualizan automáticamente** cuando abres una conversación (cada 5 segundos)
3. **Solo ves conversaciones de TUS coordinaciones** (filtrado por `dj_responsable_id`)
4. **Los mensajes se marcan como leídos** automáticamente al abrir la conversación
5. **El sistema funciona en tiempo real** gracias a los polling automáticos

---

**Última actualización**: 4 de Diciembre, 2025

