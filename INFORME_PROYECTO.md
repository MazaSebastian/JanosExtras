# Informe Completo del Proyecto - Sistema de Extras DJs Janos

**Fecha:** 24 de Noviembre de 2025  
**Versión:** 1.0  
**Estado:** Producción

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura y Tecnologías](#arquitectura-y-tecnologías)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Funcionalidades Principales](#funcionalidades-principales)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Componentes Principales](#componentes-principales)
8. [Autenticación y Seguridad](#autenticación-y-seguridad)
9. [Deployment y Configuración](#deployment-y-configuración)
10. [Estado Actual](#estado-actual)
11. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Descripción General

Sistema de gestión integral para DJs que permite:
- Control de eventos y cálculo de extras
- Gestión de fichadas (ingreso/egreso) con validación geolocalizada
- Coordinación de eventos (XV, Casamiento, Corporativo, Cumpleaños)
- Gestión de software y shows
- Adicionales técnicos por salón y fecha
- Panel administrativo completo

**URL de Producción:** https://janosdjs.com

---

## 🏗️ Arquitectura y Tecnologías

### Frontend
- **Framework:** Next.js 13+ (App Router)
- **Lenguaje:** JavaScript/React
- **Estilos:** CSS Modules
- **Estado:** React Hooks (useState, useEffect, useMemo, useCallback)
- **Rutas:** Next.js Router
- **HTTP Client:** Axios
- **Fechas:** date-fns
- **Mapas:** @react-google-maps/api

### Backend
- **Runtime:** Node.js (Serverless Functions en Vercel)
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM/Query:** pg (node-postgres)
- **Autenticación:** JWT (JSON Web Tokens)
- **Validación:** Zod (implementado parcialmente)

### Infraestructura
- **Hosting:** Vercel
- **Base de Datos:** Supabase (PostgreSQL)
- **Dominio:** janosdjs.com
- **Backups:** Automatizados semanalmente a Google Drive

---

## 📁 Estructura del Proyecto

```
SISTEMA EXTRAS JANOS/
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React reutilizables
│   │   │   ├── Calendar.js
│   │   │   ├── Dashboard.js
│   │   │   ├── DJLayout.js
│   │   │   ├── FichadasPanel.js
│   │   │   ├── CoordinacionesPanel.js
│   │   │   ├── CoordinacionFlujo.js
│   │   │   ├── SoftwarePanel.js
│   │   │   ├── ShowsPanel.js
│   │   │   ├── AdicionalesTecnicaPanel.js
│   │   │   ├── AdicionalesTecnicaAdmin.js
│   │   │   ├── LocationMap.js
│   │   │   ├── SalonCoordinatesEditor.js
│   │   │   └── Loading.js
│   │   ├── pages/
│   │   │   ├── api/             # API Routes (Next.js)
│   │   │   │   ├── auth/
│   │   │   │   ├── eventos/
│   │   │   │   ├── fichadas/
│   │   │   │   ├── coordinaciones/
│   │   │   │   ├── software/
│   │   │   │   ├── shows/
│   │   │   │   ├── adicionales-tecnica/
│   │   │   │   └── admin/
│   │   │   ├── dashboard/       # Páginas para DJs
│   │   │   │   ├── index.js (Eventos y Extras)
│   │   │   │   ├── home.js
│   │   │   │   ├── fichadas.js
│   │   │   │   ├── software.js
│   │   │   │   ├── shows.js
│   │   │   │   ├── coordinaciones/
│   │   │   │   └── adicionales-tecnica.js
│   │   │   ├── admin/           # Páginas para Administradores
│   │   │   │   └── index.js
│   │   │   └── login.js
│   │   ├── lib/
│   │   │   ├── models/          # Modelos de base de datos
│   │   │   │   ├── Event.js
│   │   │   │   ├── DJ.js
│   │   │   │   ├── Salon.js
│   │   │   │   ├── Fichada.js
│   │   │   │   ├── Coordinacion.js
│   │   │   │   ├── CoordinacionFlujo.js
│   │   │   │   ├── Software.js
│   │   │   │   ├── Show.js
│   │   │   │   ├── AdicionalTecnica.js
│   │   │   │   └── AdminDashboard.js
│   │   │   ├── database-config.js
│   │   │   ├── auth.js
│   │   │   └── utils/
│   │   │       ├── geolocation.js
│   │   │       ├── rateLimiter.js
│   │   │       ├── retry.js
│   │   │       └── coordinateParser.js
│   │   ├── services/
│   │   │   └── api.js           # Cliente API centralizado
│   │   ├── styles/              # CSS Modules
│   │   └── utils/
│   │       ├── auth.js
│   │       └── colors.js
│   ├── package.json
│   └── .env.local               # Variables de entorno (local)
├── database/
│   ├── schema.sql               # Esquema completo de BD
│   ├── migrations/              # Migraciones versionadas
│   └── *.sql                    # Scripts SQL adicionales
├── scripts/
│   ├── backup.sh                # Script de backup
│   └── upload_backup.sh         # Script de upload a Google Drive
└── INFORME_PROYECTO.md          # Este documento
```

---

## 🗄️ Base de Datos

### Tablas Principales

#### `djs`
- **Propósito:** Almacena información de los DJs
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `nombre` (VARCHAR, UNIQUE)
  - `password` (VARCHAR, hasheado con bcrypt)
  - `rol` (VARCHAR, 'dj' o 'admin')
  - `color_hex` (VARCHAR, color asignado)
  - `salon_id` (INTEGER, FK a salones)
  - `fecha_registro` (TIMESTAMP)

#### `salones`
- **Propósito:** Salones donde se realizan eventos
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `nombre` (VARCHAR, UNIQUE)
  - `direccion` (TEXT)
  - `latitud` (DECIMAL, para geolocalización)
  - `longitud` (DECIMAL, para geolocalización)
  - `activo` (BOOLEAN)

#### `eventos`
- **Propósito:** Eventos marcados por los DJs
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `dj_id` (INTEGER, FK a djs)
  - `salon_id` (INTEGER, FK a salones)
  - `fecha_evento` (DATE)
  - `confirmado` (BOOLEAN)
  - `fecha_marcado` (TIMESTAMP)
- **Restricción:** `UNIQUE(dj_id, salon_id, fecha_evento)` - Permite hasta 3 DJs por fecha/salón

#### `fichadas`
- **Propósito:** Registro de ingreso/egreso de DJs
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `dj_id` (INTEGER, FK a djs)
  - `tipo` (VARCHAR, 'ingreso' o 'egreso')
  - `latitud` (DECIMAL, validación geolocalizada)
  - `longitud` (DECIMAL, validación geolocalizada)
  - `comentario` (TEXT)
  - `registrado_en` (TIMESTAMP)
- **Validaciones:**
  - No permite dos ingresos consecutivos sin egreso
  - Valida que el DJ esté dentro de 500m del salón asignado (solo para ingreso)

#### `coordinaciones`
- **Propósito:** Coordinaciones de eventos
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `titulo` (VARCHAR)
  - `nombre_cliente` (VARCHAR)
  - `tipo_evento` (VARCHAR: 'XV', 'Casamiento', 'Corporativo', 'Religioso', 'Cumpleaños')
  - `codigo_evento` (VARCHAR)
  - `fecha_evento` (DATE)
  - `estado` (VARCHAR: 'pendiente', 'en_proceso', 'completado', 'cancelada')
  - `prioridad` (VARCHAR: 'baja', 'normal', 'alta', 'urgente')
  - `salon_id` (INTEGER, FK)
  - `dj_responsable_id` (INTEGER, FK)

#### `coordinaciones_flujo`
- **Propósito:** Almacena las respuestas del flujo de coordinación
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `coordinacion_id` (INTEGER, FK)
  - `paso_actual` (INTEGER)
  - `tipo_evento` (VARCHAR)
  - `respuestas` (JSONB) - Todas las respuestas del flujo
  - `estado` (VARCHAR: 'iniciado', 'en_proceso', 'completado')
  - `completado` (BOOLEAN)
  - `fecha_inicio`, `fecha_actualizacion`, `fecha_completado` (TIMESTAMP)

#### `software`
- **Propósito:** Enlaces de descarga de software
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `nombre` (VARCHAR)
  - `descripcion` (TEXT)
  - `url_descarga` (TEXT)
  - `categoria` (VARCHAR)
  - `activo` (BOOLEAN)
  - `creado_por` (INTEGER, FK)

#### `shows`
- **Propósito:** Pistas de audio para shows
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `nombre` (VARCHAR)
  - `descripcion` (TEXT)
  - `url_descarga` (TEXT)
  - `categoria` (VARCHAR)
  - `activo` (BOOLEAN)
  - `creado_por` (INTEGER, FK)

#### `adicionales_tecnica`
- **Propósito:** Adicionales técnicos por salón y fecha
- **Campos principales:**
  - `id` (SERIAL PRIMARY KEY)
  - `salon_id` (INTEGER, FK)
  - `fecha_evento` (DATE)
  - `adicionales` (JSONB) - {chispas, humo, lasers, otros}
  - `notas` (TEXT)
  - `archivo_pdf_url` (TEXT)
  - `UNIQUE(salon_id, fecha_evento)`

### Índices Importantes
- `idx_eventos_dj_id`, `idx_eventos_salon_id`, `idx_eventos_fecha`
- `idx_fichadas_dj_registrado_en`
- `idx_coordinaciones_flujo_coordinacion_id`
- `idx_adicionales_salon_fecha`

---

## 🎨 Funcionalidades Principales

### 1. Eventos y Extras (DJs)
- **Ubicación:** `/dashboard`
- **Funcionalidades:**
  - Calendario anual interactivo
  - Marcado de eventos por fecha y salón
  - Resumen mensual con cálculo de extras
  - Filtros por rango de fechas
  - Exportación a CSV
  - Eliminación de eventos marcados por error
  - Soporte para hasta 3 DJs por fecha/salón
  - Visualización de eventos históricos totales

### 2. Fichadas (DJs)
- **Ubicación:** `/dashboard/fichadas`
- **Funcionalidades:**
  - Marcar ingreso/egreso
  - Validación geolocalizada (500m del salón)
  - Mapa en tiempo real con ubicación del DJ y salón
  - Lista de últimas fichadas
  - Validación de secuencia (no permite dos ingresos consecutivos)
  - Rate limiting (5 requests/minuto)

### 3. Coordinaciones (DJs)
- **Ubicación:** `/dashboard/coordinaciones`
- **Funcionalidades:**
  - Crear nuevas coordinaciones
  - Filtros por estado y prioridad
  - Flujos paso a paso por tipo de evento:
    - **XV:** 10 pasos (Temática, Música, Ingresos, Vals, Velas, Coreografías, Brindis, Carioca, Tandas)
    - **Casamiento:** 10 pasos (Estilo, Música, Ceremonia, Ingresos, Vals, Coreografías, Ramo/Whisky, Carioca, Tandas)
    - **Corporativo:** 6 pasos (Temática, Colores, Escenario, Pantalla, Sorteos, Tandas)
    - **Cumpleaños:** 7 pasos (Temática, Música, Ingreso, Coreografías, Brindis, Tandas, Carioca)
    - **Religioso:** Pendiente de implementar
  - Modal de resumen con toda la información
  - Exportación a PDF
  - Botón "Ver Coordinación" para ver resumen completo
  - Ordenamiento por fecha más próxima

### 4. Software y Shows (DJs)
- **Ubicaciones:** `/dashboard/software`, `/dashboard/shows`
- **Funcionalidades:**
  - Lista de recursos disponibles
  - Filtros por categoría
  - Enlaces de descarga directa
  - CRUD completo (solo admin puede crear/editar)

### 5. Adicionales Técnica (DJs)
- **Ubicación:** `/dashboard/adicionales-tecnica`
- **Funcionalidades:**
  - Visualización de adicionales por salón y fecha
  - Filtros por salón, fecha específica o rango
  - Categorización: chispas, humo, lasers, otros

### 6. Panel Administrativo
- **Ubicación:** `/admin`
- **Funcionalidades:**
  - **Home:** Resumen general con estadísticas
  - **Resumen General:** Total DJs, eventos, salones activos
  - **DJs:** Gestión completa (editar nombre, salón, color)
  - **Salones:** Configuración de coordenadas con Google Maps
  - **Fichadas:** Visualización y filtros de todas las fichadas
  - **Calendario:** Vista anual con filtros por DJ y rango de fechas
  - **Adicionales Técnica:** Carga de PDFs y procesamiento automático
  - Exportación de reportes CSV
  - Visualización de eventos por DJ

### 7. Home (Nuevo)
- **DJs:** `/dashboard/home`
  - Resumen de eventos y extras
  - Últimas fichadas
  - Coordinaciones próximas
  - Software y shows recientes
- **Admin:** Sección Home en `/admin`
  - Resumen general
  - Coordinaciones próximas
  - Fichadas recientes
  - Top DJs del mes

---

## 🔌 APIs y Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de DJs
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil del usuario autenticado

### Eventos
- `POST /api/eventos` - Crear evento
- `GET /api/eventos/mis-eventos` - Eventos del DJ (con filtros)
- `GET /api/eventos/resumen-mensual` - Resumen mensual
- `DELETE /api/eventos/[id]` - Eliminar evento

### Fichadas
- `POST /api/fichadas` - Crear fichada (ingreso/egreso)
- `GET /api/fichadas` - Listar fichadas del DJ
- `GET /api/admin/fichadas` - Listar todas las fichadas (admin)

### Coordinaciones
- `GET /api/coordinaciones` - Listar coordinaciones
- `POST /api/coordinaciones` - Crear coordinación
- `GET /api/coordinaciones/[id]` - Obtener coordinación
- `PATCH /api/coordinaciones/[id]` - Actualizar coordinación
- `DELETE /api/coordinaciones/[id]` - Eliminar coordinación
- `GET /api/coordinaciones/[id]/flujo` - Obtener flujo de coordinación
- `POST /api/coordinaciones/[id]/flujo` - Guardar progreso del flujo
- `POST /api/coordinaciones/[id]/flujo/complete` - Completar flujo

### Software
- `GET /api/software` - Listar software
- `POST /api/software` - Crear software (admin)
- `GET /api/software/[id]` - Obtener software
- `PATCH /api/software/[id]` - Actualizar software (admin)
- `DELETE /api/software/[id]` - Eliminar software (admin)

### Shows
- `GET /api/shows` - Listar shows
- `POST /api/shows` - Crear show (admin)
- `GET /api/shows/[id]` - Obtener show
- `PATCH /api/shows/[id]` - Actualizar show (admin)
- `DELETE /api/shows/[id]` - Eliminar show (admin)

### Adicionales Técnica
- `GET /api/adicionales-tecnica` - Listar adicionales
- `POST /api/adicionales-tecnica` - Crear adicional (admin)
- `POST /api/adicionales-tecnica/upload-pdf` - Subir y procesar PDF (admin)
- `PATCH /api/adicionales-tecnica/[id]` - Actualizar adicional (admin)
- `DELETE /api/adicionales-tecnica/[id]` - Eliminar adicional (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard administrativo
- `PATCH /api/admin/djs/[id]` - Actualizar DJ
- `GET /api/admin/djs/[id]/eventos` - Eventos de un DJ
- `GET /api/admin/fichadas` - Todas las fichadas

### Salones
- `GET /api/salones` - Listar salones
- `GET /api/salones/[id]` - Obtener salón
- `PATCH /api/salones/[id]` - Actualizar coordenadas del salón

---

## 🧩 Componentes Principales

### `Calendar.js`
- Calendario anual interactivo
- Soporte para múltiples DJs por fecha
- Resaltado de feriados nacionales (Argentina)
- Tooltips con información de eventos y feriados
- Filtros por rango de fechas

### `Dashboard.js`
- Resumen mensual de eventos
- Cálculo de extras y sueldo adicional
- Filtros por mes/año o rango de fechas
- Exportación a CSV
- Visualización de eventos históricos totales

### `FichadasPanel.js`
- Interfaz de fichadas para DJs
- Integración con Google Maps
- Validación geolocalizada
- Lista de movimientos recientes (expandible)

### `CoordinacionesPanel.js`
- Lista de coordinaciones
- Filtros por estado y prioridad
- Modal de creación/edición
- Botón "Ver Coordinación" con modal de resumen
- Botón "Play" con opciones (Iniciar, Pre-Coordinación)

### `CoordinacionFlujo.js`
- Flujo paso a paso dinámico según tipo de evento
- Validación de pasos
- Guardado de progreso
- Modal para agregar velas (XV)
- Pantalla de resumen final
- Exportación a PDF

### `DJLayout.js`
- Layout con sidebar para DJs
- Menú de navegación
- Responsive con hamburger menu
- Manejo de autenticación

### `Loading.js`
- Componente centralizado de loading
- Variantes: spinner, skeleton, overlay
- Estados de carga estéticos

---

## 🔐 Autenticación y Seguridad

### Autenticación
- **Método:** JWT (JSON Web Tokens)
- **Almacenamiento:** localStorage
- **Expiración:** Tokens con expiración configurable
- **Protección de rutas:** Middleware `authenticateToken` en todas las APIs

### Validaciones
- **Rate Limiting:** Implementado para fichadas (5 req/min)
- **Geolocalización:** Validación de 500m para fichadas de ingreso
- **Validación de secuencia:** No permite dos ingresos consecutivos
- **Roles:** Separación entre 'dj' y 'admin'

### Seguridad
- Passwords hasheados con bcrypt
- Variables de entorno para datos sensibles
- Validación de inputs en APIs
- CORS configurado para producción

---

## 🚀 Deployment y Configuración

### Vercel
- **Proyecto:** janos-extras
- **Root Directory:** `frontend`
- **Framework:** Next.js
- **Build Command:** Automático
- **Environment Variables:**
  - `DATABASE_URL` - Connection string de Supabase
  - `JWT_SECRET` - Secret para JWT
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - API Key de Google Maps
  - `SENTRY_DSN` - DSN de Sentry (opcional)

### Supabase
- **Base de Datos:** PostgreSQL
- **Connection Pooler:** Habilitado para Vercel
- **Backups:** Automatizados semanalmente

### Google Maps
- **API Key:** Configurada en Vercel
- **Uso:** Geolocalización y mapas interactivos
- **Restricciones:** Configuradas por dominio

### Backups
- **Frecuencia:** Semanal (Lunes 03:00 AM)
- **Destino:** Google Drive
- **Script:** `scripts/backup.sh` y `scripts/upload_backup.sh`
- **Cron:** Configurado en macOS

---

## 📊 Estado Actual

### ⚠️ IMPORTANTE - Estado de Deployment

**Último deploy en producción:** Pendiente de deployment  
**Fecha/Hora actual:** 24 de Noviembre de 2025, 18:15  
**Último commit:** d210fee - "Feat: Agregar páginas Home para DJs y Administradores con resúmenes"  
**Funcionalidades pendientes de deploy:**
- ❌ **Home para DJs y Administradores** - Implementado pero NO en producción
- ❌ **Ordenamiento de coordinaciones por fecha próxima** - Implementado pero NO en producción
- ❌ **Botón "Ver Coordinación" con modal de resumen** - Implementado pero NO en producción
- ❌ **Guardado del flujo de coordinación al completarlo** - Implementado pero NO en producción

**Nota:** Estas funcionalidades están en el código fuente pero requieren un nuevo deployment a Vercel para estar disponibles en producción (janosdjs.com).

### ✅ Funcionalidades Completadas y en Producción
- [x] Sistema de eventos y extras
- [x] Cálculo automático de sueldo adicional
- [x] Fichadas con geolocalización
- [x] Coordinaciones con flujos dinámicos (XV, Casamiento, Corporativo, Cumpleaños)
- [x] Software y Shows
- [x] Adicionales Técnica con procesamiento de PDFs
- [x] Panel administrativo completo
- [x] Exportación de reportes CSV
- [x] Validación geolocalizada
- [x] Sistema de backups automatizado
- [x] Integración con Sentry (logging)
- [x] Responsive design

### 🔄 Mejoras Recientes (Pendientes de Deploy)
- Páginas Home implementadas (NO en producción)
- Botón "Ver Coordinación" con modal de resumen (NO en producción)
- Guardado del flujo de coordinación al completarlo (NO en producción)
- Normalización de estados de coordinación (NO en producción)
- Optimización de carga de modales (NO en producción)

### ⚠️ Pendientes
- [ ] Flujo de coordinación "Religioso"
- [ ] Pre-coordinación por email/notificación
- [ ] Mejoras en el procesamiento de PDFs de adicionales técnica
- [ ] Notificaciones push
- [ ] Dashboard de analytics avanzado

---

## 🔧 Configuración Local

### Requisitos
- Node.js 18+
- npm o yarn
- PostgreSQL (o acceso a Supabase)

### Instalación
```bash
cd frontend
npm install
cp sample.env.local .env.local
# Configurar variables en .env.local
npm run dev
```

### Variables de Entorno (.env.local)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secret_aqui
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
SENTRY_DSN=tu_dsn (opcional)
```

---

## 📝 Notas Importantes

### Cálculo de Extras
- Los primeros 8 eventos del mes son parte del sueldo base
- A partir del evento 9, se calculan como "extras"
- Fórmula: `eventos_extras = Math.max(0, total_eventos - 8)`

### Múltiples DJs por Evento
- Máximo 3 DJs pueden marcar la misma fecha/salón
- Cada DJ solo puede marcar una vez por fecha/salón
- Restricción: `UNIQUE(dj_id, salon_id, fecha_evento)`

### Geolocalización
- Radio de validación: 500 metros
- Solo se valida en fichadas de "ingreso"
- Usa fórmula de Haversine para calcular distancia

### Coordinaciones
- Estados: pendiente, en_proceso, completado, cancelada
- Prioridades: baja, normal, alta, urgente
- El flujo se guarda en `coordinaciones_flujo` como JSONB
- Ordenamiento: fechas futuras primero, luego pasadas

### Administradores
- No tienen salón asignado (`salon_id = NULL`)
- No aparecen en listas de DJs
- Acceso completo a todas las funcionalidades

---

## 🎯 Próximos Pasos Sugeridos

1. **Completar flujo Religioso** de coordinaciones
2. **Implementar notificaciones** para coordinaciones y fichadas
3. **Mejorar analytics** en el dashboard administrativo
4. **Optimizar rendimiento** con más caching
5. **Agregar tests** unitarios y de integración
6. **Documentación de API** con Swagger/OpenAPI
7. **Implementar Pre-Coordinación** por email
8. **Mejorar procesamiento de PDFs** para adicionales técnica

---

## 📞 Contacto y Soporte

- **Repositorio:** GitHub (MazaSebastian/JanosExtras)
- **Deployment:** Vercel (janos-extras)
- **Base de Datos:** Supabase
- **Dominio:** janosdjs.com

---

**Última actualización:** 24 de Noviembre de 2025, 18:15  
**Versión del documento:** 1.1  
**Estado de Deployment:** Pendiente - Home y mejoras recientes requieren nuevo deploy

