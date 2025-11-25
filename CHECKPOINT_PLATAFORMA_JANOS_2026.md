# Checkpoint: Plataforma Janos 2026

**Fecha de creación:** Diciembre 2024  
**Versión:** Plataforma Janos 2026  
**Propósito:** Punto de recupero ante error crítico

---

## 📋 Descripción

Este checkpoint representa el estado estable de la plataforma a finales de 2024, incluyendo todas las funcionalidades implementadas hasta esta fecha. Este punto de recupero debe usarse en caso de:

- Errores críticos en producción
- Necesidad de revertir cambios problemáticos
- Restauración completa del sistema
- Migración a nueva infraestructura

---

## 🗂️ Contenido del Checkpoint

### 1. Código Fuente
- **Tag Git:** `Plataforma-Janos-2026`
- **Commit:** Verificar con `git show Plataforma-Janos-2026`
- **Repositorio:** https://github.com/MazaSebastian/JanosExtras.git

### 2. Base de Datos
- **Backup SQL:** `backups/checkpoint_plataforma_janos_2026.sql`
- **Esquema completo:** `database/schema-completo.sql`
- **Migraciones:** `database/migrations/`

### 3. Funcionalidades Incluidas

#### ✅ Sistema de Eventos y Extras
- Calendario anual interactivo
- Marcado de eventos por fecha y salón
- Cálculo automático de extras
- Resumen mensual con exportación CSV

#### ✅ Fichadas
- Sistema de ingreso/egreso
- Validación geolocalizada (500m)
- Mapa en tiempo real
- Rate limiting

#### ✅ Coordinaciones
- Flujos dinámicos por tipo de evento:
  - XV (10 pasos)
  - Casamiento (10 pasos)
  - Corporativo (6 pasos)
  - Cumpleaños (7 pasos)
- Exportación a PDF
- Modal de resumen

#### ✅ Software
- CRUD completo
- Filtros por categoría
- Todos los DJs pueden crear/editar/eliminar

#### ✅ Shows
- CRUD completo (solo admins)
- Filtros por categoría
- Área artística controlada

#### ✅ Contenido
- CRUD completo
- Tipos: Visual, Pack de Música, Remix, Otro
- Todos los DJs pueden crear/editar/eliminar

#### ✅ Adicionales Técnica
- Gestión por salón y fecha
- Procesamiento de PDFs
- Filtros avanzados

#### ✅ Panel Administrativo
- Resumen general con tabla de DJs
- Gestión de DJs, Salones, Fichadas
- Calendario por DJ
- Adicionales Técnica

#### ✅ Home para DJs y Admin
- Resúmenes personalizados
- Coordinaciones próximas
- Fichadas recientes
- Adicionales de técnica

---

## 🔄 Cómo Restaurar desde este Checkpoint

### Opción 1: Restaurar Código desde Git Tag

```bash
# Clonar el repositorio
git clone https://github.com/MazaSebastian/JanosExtras.git
cd JanosExtras

# Cambiar al checkpoint
git checkout Plataforma-Janos-2026

# Instalar dependencias
cd frontend
npm install

# Configurar variables de entorno
cp sample.env.local .env.local
# Editar .env.local con las credenciales correctas
```

### Opción 2: Restaurar Base de Datos

```bash
# Conectar a Supabase y ejecutar el backup SQL
psql $DATABASE_URL < backups/checkpoint_plataforma_janos_2026.sql

# O desde Supabase Dashboard:
# 1. Ir a SQL Editor
# 2. Ejecutar el contenido de backups/checkpoint_plataforma_janos_2026.sql
```

### Opción 3: Restauración Completa

1. **Restaurar código:**
   ```bash
   git checkout Plataforma-Janos-2026
   ```

2. **Restaurar base de datos:**
   ```bash
   # Ejecutar backup SQL en Supabase
   ```

3. **Configurar variables de entorno:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

4. **Desplegar:**
   ```bash
   # El deploy automático se activará con el push
   git push origin Plataforma-Janos-2026:main
   ```

---

## 📊 Estado de la Base de Datos

### Tablas Principales
- `djs` - Usuarios del sistema
- `salones` - Salones de eventos
- `eventos` - Eventos marcados por DJs
- `fichadas` - Registro de ingresos/egresos
- `coordinaciones` - Coordinaciones de eventos
- `coordinaciones_flujo` - Flujos de coordinación
- `software` - Catálogo de software
- `shows` - Pistas de audio para shows
- `contenido` - Contenido compartido (visuales, packs, remixes)
- `adicionales_tecnica` - Adicionales técnicos por salón/fecha

### Índices y Optimizaciones
- Índices en eventos (dj_id, salon_id, fecha_evento)
- Índices en fichadas (dj_id, registrado_en)
- Índices en coordinaciones_flujo
- Índices en adicionales_tecnica

---

## 🚀 Deployment

### Vercel
- **Proyecto:** janos-extras
- **Root Directory:** `frontend`
- **Framework:** Next.js
- **URL de Producción:** https://janosdjs.com

### Variables de Entorno Requeridas
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu_secret_aqui
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
SENTRY_DSN=tu_dsn (opcional)
```

---

## 📝 Notas Importantes

1. **Este checkpoint NO incluye datos de usuarios** por seguridad
2. **Los backups de base de datos deben ejecutarse manualmente** desde Supabase
3. **Verificar que todas las migraciones estén aplicadas** antes de restaurar
4. **Probar en ambiente de desarrollo** antes de restaurar en producción

---

## 🔧 Scripts Útiles

### Crear Backup de Base de Datos
```bash
# Ejecutar desde Supabase Dashboard > Database > Backups
# O usar pg_dump:
pg_dump $DATABASE_URL > backups/checkpoint_plataforma_janos_2026.sql
```

### Verificar Estado del Checkpoint
```bash
git show Plataforma-Janos-2026
git log --oneline Plataforma-Janos-2026
```

### Comparar con Versión Actual
```bash
git diff Plataforma-Janos-2026..main
```

---

## 📞 Contacto

- **Repositorio:** https://github.com/MazaSebastian/JanosExtras.git
- **Tag:** `Plataforma-Janos-2026`
- **Fecha de Creación:** Diciembre 2024

---

**⚠️ IMPORTANTE:** Este checkpoint es un punto de recupero crítico. Solo debe usarse en situaciones de emergencia o cuando sea necesario revertir a un estado estable conocido.

