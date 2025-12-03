# Evaluación: Integración con Calendarios (Google Calendar / Apple Calendar)

## 📅 Resumen Ejecutivo

**Sí, es totalmente posible** integrar Google Calendar y Apple Calendar para agendar videollamadas y coordinaciones directamente desde la aplicación. Esta funcionalidad mejoraría significativamente el flujo de trabajo y la experiencia del usuario.

---

## ✅ Google Calendar API

### Ventajas
- ✅ **API completa y bien documentada**
- ✅ **Fácil integración** con OAuth 2.0
- ✅ **Sincronización bidireccional** (crear eventos desde la app y ver eventos creados en Google Calendar)
- ✅ **Soporte para videollamadas** (Google Meet automático)
- ✅ **Notificaciones automáticas** por email
- ✅ **Recordatorios configurables**
- ✅ **Gratis** para uso básico (hasta 1 millón de requests/día)

### Funcionalidades que se podrían implementar:

1. **Crear eventos desde la coordinación**
   - Al crear/editar una coordinación, opción de "Agendar videollamada"
   - Se crea automáticamente un evento en Google Calendar del DJ
   - Incluye: fecha, hora, duración, descripción, link de Google Meet

2. **Sincronización bidireccional**
   - Ver eventos de Google Calendar en la app
   - Detectar conflictos de horarios
   - Mostrar disponibilidad del DJ

3. **Envío de invitaciones**
   - Enviar invitación por email al cliente
   - El cliente puede aceptar/rechazar desde su calendario
   - Notificaciones automáticas

4. **Recordatorios**
   - Recordatorios automáticos 24h antes
   - Recordatorios 1h antes
   - Notificaciones push (si se implementa)

### Requisitos Técnicos:

1. **Autenticación OAuth 2.0**
   - Cada DJ debe autorizar acceso a su Google Calendar
   - Token de acceso almacenado de forma segura
   - Refresh token para renovación automática

2. **Scopes necesarios:**
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```

3. **Librerías:**
   - `googleapis` (Node.js) - Oficial de Google
   - Muy estable y bien mantenida

4. **Configuración:**
   - Crear proyecto en Google Cloud Console
   - Habilitar Google Calendar API
   - Configurar OAuth consent screen
   - Obtener Client ID y Client Secret

### Ejemplo de Flujo:

```
1. DJ crea coordinación con fecha/hora
2. Click en "Agendar videollamada"
3. Si no está autenticado → Redirige a Google OAuth
4. Usuario autoriza acceso a Google Calendar
5. Se crea evento en Google Calendar con:
   - Título: "Coordinación: [Nombre Cliente] - [Tipo Evento]"
   - Fecha/Hora: La especificada en la coordinación
   - Duración: 1 hora (configurable)
   - Descripción: Detalles de la coordinación
   - Google Meet: Link automático generado
   - Invitados: Email del cliente (si está disponible)
6. Se guarda el eventId en la coordinación
7. Se envía email al cliente con invitación
```

### Costos:
- **Gratis** para hasta 1 millón de requests/día
- Más que suficiente para una aplicación de este tamaño

---

## 🍎 Apple Calendar (iCloud Calendar)

### Limitaciones
- ⚠️ **No hay API pública oficial** para crear eventos programáticamente
- ⚠️ **Solo lectura** mediante CalDAV (complejo)
- ⚠️ **Requiere credenciales de iCloud** del usuario
- ⚠️ **Menos flexible** que Google Calendar

### Alternativas para Apple:

1. **CalDAV Protocol**
   - Protocolo estándar para calendarios
   - Funciona con iCloud, pero requiere:
     - Credenciales de iCloud del usuario
     - Configuración manual de servidor CalDAV
     - Más complejo de implementar

2. **Generar archivo .ics**
   - Crear archivo de calendario estándar
   - El usuario descarga y agrega manualmente a su calendario
   - Funciona con Apple Calendar, Google Calendar, Outlook, etc.
   - **Más simple pero menos automático**

3. **Enfoque híbrido recomendado:**
   - **Google Calendar**: Integración completa (crear eventos automáticamente)
   - **Apple Calendar / Otros**: Generar archivo .ics para descarga manual

---

## 🎯 Recomendación de Implementación

### Fase 1: Google Calendar (Prioridad Alta)
- Integración completa con Google Calendar API
- Crear eventos automáticamente
- Incluir Google Meet
- Enviar invitaciones por email

### Fase 2: Archivo .ics (Prioridad Media)
- Generar archivo .ics para descarga
- Compatible con Apple Calendar, Outlook, etc.
- Opción de "Agregar a calendario" que descarga el archivo

### Fase 3: CalDAV (Prioridad Baja - Solo si es necesario)
- Integración con CalDAV para Apple Calendar
- Más complejo, solo si hay demanda específica

---

## 📋 Funcionalidades Propuestas

### 1. Agendar Videollamada desde Coordinación
```
- Botón "Agendar Videollamada" en coordinación
- Modal con:
  - Fecha (pre-llenada desde coordinación)
  - Hora (selector)
  - Duración (30min, 1h, 1.5h, 2h)
  - Descripción (pre-llenada con detalles)
  - Incluir Google Meet (checkbox)
  - Enviar invitación a cliente (si tiene email)
- Al confirmar → Crea evento en Google Calendar
- Guarda eventId en coordinación
```

### 2. Ver Calendario del DJ
```
- Nueva sección "Mi Calendario"
- Muestra eventos de Google Calendar
- Filtros:
  - Solo coordinaciones
  - Todos los eventos
  - Por rango de fechas
- Vista de calendario mensual/semanal
```

### 3. Detección de Conflictos
```
- Al crear coordinación, verificar disponibilidad
- Mostrar alerta si hay conflicto de horarios
- Sugerir horarios alternativos
```

### 4. Recordatorios
```
- Configuración de recordatorios por DJ
- Notificaciones:
  - Email 24h antes
  - Email 1h antes
  - Push notification (futuro)
```

### 5. Sincronización
```
- Botón "Sincronizar con Google Calendar"
- Actualiza eventos desde Google Calendar
- Detecta cambios realizados fuera de la app
```

---

## 🔧 Requisitos Técnicos Detallados

### Backend (Node.js/Next.js API Routes)

1. **Instalación:**
   ```bash
   npm install googleapis
   ```

2. **Configuración OAuth:**
   ```javascript
   const { google } = require('googleapis');
   
   const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
   );
   ```

3. **Endpoints necesarios:**
   - `POST /api/calendar/auth` - Iniciar autenticación OAuth
   - `GET /api/calendar/callback` - Callback de OAuth
   - `POST /api/calendar/events` - Crear evento
   - `GET /api/calendar/events` - Listar eventos
   - `PUT /api/calendar/events/:id` - Actualizar evento
   - `DELETE /api/calendar/events/:id` - Eliminar evento
   - `GET /api/calendar/availability` - Verificar disponibilidad

### Base de Datos

**Nueva tabla o campos:**
```sql
ALTER TABLE coordinaciones ADD COLUMN google_calendar_event_id VARCHAR(255);
ALTER TABLE coordinaciones ADD COLUMN videollamada_agendada BOOLEAN DEFAULT false;
ALTER TABLE coordinaciones ADD COLUMN videollamada_fecha TIMESTAMP;
ALTER TABLE coordinaciones ADD COLUMN videollamada_duracion INTEGER; -- minutos
ALTER TABLE coordinaciones ADD COLUMN videollamada_meet_link TEXT;

-- Nueva tabla para tokens de OAuth
CREATE TABLE google_calendar_tokens (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER REFERENCES djs(id),
  access_token TEXT,
  refresh_token TEXT,
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Frontend

1. **Componentes nuevos:**
   - `AgendarVideollamadaModal.js` - Modal para agendar
   - `CalendarioDJ.js` - Vista de calendario
   - `GoogleCalendarSync.js` - Botón de sincronización

2. **Integración:**
   - Botón en `CoordinacionesPanel.js`
   - Nueva sección en menú lateral
   - Indicador visual si tiene videollamada agendada

---

## 💰 Costos Estimados

### Google Calendar API
- **Gratis**: Hasta 1 millón de requests/día
- **Suficiente** para cientos de DJs con uso intensivo

### Infraestructura
- **Sin costos adicionales** si ya usas Vercel/PostgreSQL
- Solo almacenamiento de tokens (mínimo)

### Desarrollo
- **Tiempo estimado**: 2-3 semanas
- **Complejidad**: Media-Alta
- **Mantenimiento**: Bajo (API estable)

---

## 🚀 Plan de Implementación Sugerido

### Sprint 1: Autenticación y Configuración
- [ ] Configurar Google Cloud Project
- [ ] Implementar OAuth 2.0 flow
- [ ] Guardar tokens en base de datos
- [ ] UI para conectar Google Calendar

### Sprint 2: Crear Eventos
- [ ] Endpoint para crear eventos
- [ ] Modal de agendar videollamada
- [ ] Integración con Google Meet
- [ ] Guardar eventId en coordinación

### Sprint 3: Listar y Sincronizar
- [ ] Endpoint para listar eventos
- [ ] Vista de calendario
- [ ] Sincronización bidireccional
- [ ] Detección de conflictos

### Sprint 4: Invitaciones y Recordatorios
- [ ] Enviar invitaciones por email
- [ ] Configuración de recordatorios
- [ ] Notificaciones automáticas
- [ ] Generar archivo .ics

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Tokens almacenados encriptados
- ✅ Refresh tokens seguros
- ✅ Validar permisos antes de cada operación
- ✅ No exponer tokens en frontend

### Privacidad
- ✅ Cada DJ solo ve su propio calendario
- ✅ No compartir información entre DJs
- ✅ Cliente solo recibe invitación, no acceso al calendario

### UX
- ✅ Proceso de autenticación simple
- ✅ Feedback claro cuando se crea evento
- ✅ Opción de desconectar Google Calendar
- ✅ Manejo de errores (ej: sin conexión)

### Limitaciones
- ⚠️ Requiere que cada DJ tenga cuenta de Google
- ⚠️ Primera vez requiere autorización manual
- ⚠️ Si el DJ cambia contraseña, puede requerir re-autenticación

---

## 📊 Comparativa Rápida

| Característica | Google Calendar | Apple Calendar | Archivo .ics |
|---------------|----------------|----------------|--------------|
| Crear eventos automático | ✅ Sí | ❌ No | ❌ No |
| Sincronización bidireccional | ✅ Sí | ⚠️ Complejo | ❌ No |
| Google Meet integrado | ✅ Sí | ❌ No | ❌ No |
| Invitaciones automáticas | ✅ Sí | ❌ No | ❌ No |
| Facilidad de implementación | ✅ Alta | ❌ Baja | ✅ Alta |
| Compatibilidad | ✅ Universal | ⚠️ Solo Apple | ✅ Universal |

---

## 🎯 Conclusión

**Recomendación: Implementar Google Calendar API**

- ✅ API robusta y bien documentada
- ✅ Funcionalidades completas
- ✅ Gratis para el uso esperado
- ✅ Mejor experiencia de usuario
- ✅ Integración con Google Meet automática

**Como complemento:** Generar archivo .ics para usuarios de Apple Calendar u otros sistemas.

**Prioridad:** Alta - Esta funcionalidad mejoraría significativamente la productividad y profesionalismo del servicio.

---

## 📚 Recursos

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google Calendar API Node.js Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)
- [iCalendar (.ics) Format Specification](https://icalendar.org/)

---

**¿Quieres que proceda con la implementación?** Puedo empezar con la Fase 1 (Google Calendar) cuando lo decidas.

