# 🐛 Guía de Debugging: Mensajes WhatsApp No Aparecen

## Problema Reportado
- Los mensajes que ingresan con la app abierta no se muestran
- Los mensajes sin leer que se reciben cuando no se está trabajando no se muestran

---

## ✅ Mejoras Implementadas

### 1. Polling Más Frecuente
- **Contador de no leídos**: Cada 10 segundos (antes: 30 segundos)
- **Lista de conversaciones**: Cada 5 segundos (antes: 10 segundos)
- **Mensajes de conversación**: Cada 3 segundos (antes: 5 segundos)

### 2. Logging Mejorado
- Logs detallados en webhook cuando se recibe un mensaje
- Logs en `updateLastActivity` para verificar incremento de `unread_count`
- Logs en frontend para ver qué conversaciones se están cargando

---

## 🔍 Pasos para Debugging

### Paso 1: Verificar que el Webhook Recibe Mensajes

1. **Abre los logs de Vercel:**
   - Ve a Vercel Dashboard → Tu proyecto → Functions → Logs
   - Filtra por `/api/whatsapp/webhook`

2. **Envía un mensaje de prueba:**
   - Desde tu WhatsApp personal al número de Twilio
   - Debe contener el código del Sandbox si es la primera vez

3. **Busca estos logs en Vercel:**
   ```
   📨 Mensaje recibido de WhatsApp: { MessageSid, From, To, Body... }
   🔍 Buscando coordinación para número: { fromNumber, toNumber... }
   ✅ Coordinación encontrada: { coordId }
   💾 Guardando mensaje en BD: { conversacionId, phoneNumber... }
   ✅ Mensaje guardado en BD: { mensajeId, conversacionId }
   📝 Actualizando última actividad e incrementando unread_count...
   ✅ Conversación actualizada con nuevo mensaje: { unreadCount, lastMessageAt }
   ```

4. **Si NO ves estos logs:**
   - El webhook no está recibiendo mensajes
   - Verifica la configuración del webhook en Twilio Console
   - Verifica que la URL del webhook sea correcta: `https://janosdjs.com/api/whatsapp/webhook`

### Paso 2: Verificar que los Mensajes se Guardan en la BD

1. **Abre Supabase SQL Editor:**
   - Ve a tu proyecto en Supabase
   - Abre el SQL Editor

2. **Ejecuta estas consultas:**

```sql
-- Ver todos los mensajes recientes
SELECT 
  wm.*,
  wc.phone_number,
  wc.coordinacion_id,
  wc.dj_id,
  wc.unread_count,
  c.dj_responsable_id,
  c.titulo as coordinacion_titulo
FROM whatsapp_mensajes wm
LEFT JOIN whatsapp_conversaciones wc ON wm.conversacion_id = wc.id
LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
ORDER BY wm.created_at DESC
LIMIT 10;

-- Ver todas las conversaciones
SELECT 
  wc.*,
  c.dj_responsable_id,
  c.titulo as coordinacion_titulo,
  c.nombre_cliente
FROM whatsapp_conversaciones wc
LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
ORDER BY wc.last_message_at DESC NULLS LAST;

-- Ver contador de no leídos por DJ
SELECT 
  c.dj_responsable_id,
  SUM(wc.unread_count) as total_no_leidos
FROM whatsapp_conversaciones wc
LEFT JOIN coordinaciones c ON wc.coordinacion_id = c.id
WHERE c.dj_responsable_id IS NOT NULL
GROUP BY c.dj_responsable_id;
```

3. **Verifica:**
   - ¿Hay mensajes en `whatsapp_mensajes`?
   - ¿Hay conversaciones en `whatsapp_conversaciones`?
   - ¿El `unread_count` es mayor que 0?
   - ¿El `dj_responsable_id` coincide con tu ID de usuario?

### Paso 3: Verificar en la Consola del Navegador

1. **Abre la consola del navegador (F12)**
2. **Abre el panel de WhatsApp**
3. **Busca estos logs:**

```
📋 Conversaciones cargadas: { total: X, conversaciones: [...] }
📊 Obteniendo contador de no leídos para DJ: { djId }
✅ Contador calculado: { count }
```

4. **Verifica:**
   - ¿Se están cargando conversaciones?
   - ¿El contador muestra el número correcto?
   - ¿Hay errores en la consola?

### Paso 4: Verificar Normalización de Números

El problema más común es que los números no coinciden por formato.

1. **En Supabase, ejecuta:**

```sql
-- Ver números de teléfono en coordinaciones
SELECT id, telefono, dj_responsable_id, titulo
FROM coordinaciones
WHERE telefono IS NOT NULL;

-- Ver números de teléfono en conversaciones
SELECT id, phone_number, coordinacion_id, dj_id, unread_count
FROM whatsapp_conversaciones;
```

2. **Compara los números:**
   - Los números deben coincidir después de normalización
   - Ejemplo: `+5491123456789` debe coincidir con `5491123456789`
   - La normalización quita `+`, espacios, guiones, paréntesis
   - Agrega `54` (Argentina) si falta

---

## 🔧 Problemas Comunes y Soluciones

### Problema 1: Webhook No Recibe Mensajes

**Síntomas:**
- No hay logs en Vercel cuando envías un mensaje
- El mensaje no aparece en la BD

**Soluciones:**
1. Verifica la URL del webhook en Twilio Console:
   - Debe ser: `https://janosdjs.com/api/whatsapp/webhook`
   - Debe estar en "When a message comes in"
2. Verifica que el número esté en el Sandbox de Twilio
3. Verifica que el mensaje contenga el código del Sandbox si es la primera vez

### Problema 2: Mensajes se Guardan pero No Aparecen

**Síntomas:**
- Hay mensajes en la BD
- Pero no aparecen en el panel

**Soluciones:**
1. Verifica que el `dj_responsable_id` de la coordinación coincida con tu ID de usuario
2. Verifica que el `unread_count` sea mayor que 0
3. Verifica que la normalización de números esté funcionando correctamente
4. Revisa los logs de la consola del navegador para ver qué conversaciones se están cargando

### Problema 3: Contador No Se Actualiza

**Síntomas:**
- Hay mensajes no leídos en la BD
- Pero el badge no muestra el número correcto

**Soluciones:**
1. Verifica que el endpoint `/api/whatsapp/unread-count` funcione
2. Revisa los logs de Vercel para ese endpoint
3. Verifica que la query esté sumando correctamente los `unread_count`

### Problema 4: Números No Coinciden

**Síntomas:**
- El mensaje llega pero no se asocia a la coordinación
- Se crea una conversación nueva en lugar de usar la existente

**Soluciones:**
1. Verifica el formato de los números en las coordinaciones
2. Asegúrate de que los números estén en formato internacional (con código de país)
3. Revisa los logs del webhook para ver cómo se están normalizando los números

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] El webhook está configurado en Twilio Console
- [ ] La URL del webhook es correcta
- [ ] El número está en el Sandbox de Twilio
- [ ] La migración SQL se ejecutó correctamente
- [ ] Hay mensajes en `whatsapp_mensajes` en Supabase
- [ ] Hay conversaciones en `whatsapp_conversaciones` en Supabase
- [ ] El `unread_count` es mayor que 0
- [ ] El `dj_responsable_id` coincide con tu ID de usuario
- [ ] Los números de teléfono están en formato correcto
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs de Vercel

---

## 🧪 Prueba Rápida

1. **Envía un mensaje desde tu WhatsApp personal:**
   - Al número: `+1 415 523 8886`
   - Con el código del Sandbox si es necesario

2. **Inmediatamente después, verifica:**
   - Logs de Vercel (debe aparecer el webhook)
   - Base de datos (debe aparecer el mensaje)
   - Panel de WhatsApp (debe aparecer la conversación)

3. **Si no aparece:**
   - Revisa los logs paso a paso
   - Compara los números de teléfono
   - Verifica que el DJ sea el correcto

---

## 📞 Información para Reportar Problemas

Si el problema persiste, proporciona:

1. **Logs de Vercel:**
   - Copia los logs del webhook cuando envías un mensaje
   - Copia los logs del endpoint de conversaciones

2. **Consulta SQL:**
   - Resultado de `SELECT * FROM whatsapp_mensajes ORDER BY created_at DESC LIMIT 5;`
   - Resultado de `SELECT * FROM whatsapp_conversaciones ORDER BY last_message_at DESC LIMIT 5;`

3. **Consola del Navegador:**
   - Copia los logs cuando abres el panel de WhatsApp
   - Copia cualquier error que aparezca

4. **Información del Mensaje:**
   - Número de teléfono desde el que enviaste
   - Número de teléfono en la coordinación
   - ID de tu usuario (DJ)

---

**Última actualización:** 5 de Diciembre, 2025

