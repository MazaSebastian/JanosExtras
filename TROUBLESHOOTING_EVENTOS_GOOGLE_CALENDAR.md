# Troubleshooting: Eventos no aparecen en Google Calendar

## 🔴 Problema

Se crea el link de Meet correctamente, pero el evento no aparece en Google Calendar.

## ✅ Soluciones

### 1. Verificar que estás viendo el calendario correcto

El evento se crea en tu calendario **"primary"** (calendario principal). Verifica:

1. Abre Google Calendar
2. En el panel izquierdo, verifica que el calendario **"Seba Maza"** (o tu nombre) esté **marcado/activado** (checkbox ✓)
3. Si tienes múltiples calendarios, asegúrate de que el calendario principal esté visible

### 2. Verificar la fecha y hora del evento

1. En Google Calendar, ve a la **fecha** donde agendaste la videollamada
2. Verifica que estés viendo la **vista correcta** (Día, Semana, Mes)
3. El evento puede estar en una hora diferente debido a la zona horaria

### 3. Verificar en el link del evento

Cuando se crea el evento, se genera un `htmlLink`. Puedes:

1. Abrir la consola del navegador (F12) cuando agendes una videollamada
2. Buscar en los logs el `htmlLink` del evento
3. O revisar los logs en Vercel:
   - Ve a **Deployments** → Último deployment → **Functions**
   - Busca `/api/google-calendar/events`
   - Revisa los logs para ver el `htmlLink`

### 4. Verificar los logs en Vercel

Después de agendar una videollamada:

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Deployments** → Último deployment
4. Haz clic en **Functions**
5. Busca `/api/google-calendar/events`
6. Revisa los logs para ver:
   - Si el evento se creó exitosamente
   - El `eventId` generado
   - El `htmlLink` del evento
   - Cualquier error

### 5. Verificar directamente en Google Calendar API

Puedes verificar si el evento existe usando el `eventId`:

1. Obtén el `eventId` de los logs de Vercel
2. O desde la base de datos (tabla `coordinaciones`, columna `google_calendar_event_id`)
3. Abre esta URL en tu navegador (reemplaza `EVENT_ID` con el ID real):
   ```
   https://calendar.google.com/calendar/event?eid=EVENT_ID
   ```

### 6. Verificar permisos del calendario

1. Ve a [Google Calendar](https://calendar.google.com)
2. Haz clic en el engranaje (⚙️) → **Configuración**
3. Ve a **Calendarios compartidos y disponibles**
4. Verifica que tu calendario principal tenga los permisos correctos

### 7. Verificar zona horaria

El evento se crea con zona horaria `America/Argentina/Buenos_Aires`. Verifica:

1. En Google Calendar, ve a **Configuración** → **Zona horaria**
2. Asegúrate de que esté configurada como `(GMT-03:00) Buenos Aires`

### 8. Verificar si el evento está en otro calendario

A veces el evento se puede crear en un calendario secundario:

1. En Google Calendar, en el panel izquierdo, **marca todos los calendarios** para verlos
2. Busca el evento en todos los calendarios visibles
3. Si lo encuentras, verifica en qué calendario está

## 🔍 Diagnóstico con Logs

Con el nuevo logging agregado, cuando agendes una videollamada, verás en los logs de Vercel:

```
📅 Datos del evento a crear: { fecha, hora, startDateTime, endDateTime }
🚀 Iniciando creación de evento en Google Calendar: { summary, startDateTime }
📅 Creando evento en Google Calendar: { summary, startDateTime, calendarId: 'primary' }
✅ Evento creado exitosamente: { eventId, htmlLink, meetLink, calendarId }
```

Si ves estos logs, el evento **se está creando correctamente**. El problema es de visualización en Google Calendar.

## 🆘 Si Nada Funciona

1. **Verifica el `htmlLink` directamente**: 
   - Obtén el `htmlLink` de los logs
   - Ábrelo en una nueva pestaña
   - Esto te llevará directamente al evento en Google Calendar

2. **Crea un evento manualmente en Google Calendar** para verificar que tu cuenta funciona correctamente

3. **Reconecta Google Calendar**:
   - Ve a tu aplicación → Coordinaciones
   - Desconecta Google Calendar
   - Vuelve a conectar
   - Intenta agendar una nueva videollamada

4. **Verifica en Google Calendar API directamente**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Ve a **APIs & Services** → **Credentials**
   - Verifica que Google Calendar API esté habilitada

## 📝 Notas Importantes

- El evento se crea en el calendario **'primary'** (calendario principal del usuario autenticado)
- El link de Meet se genera automáticamente si `conferenceData: true`
- El evento incluye recordatorios por email (24 horas antes y 1 hora antes)
- La zona horaria es `America/Argentina/Buenos_Aires`

