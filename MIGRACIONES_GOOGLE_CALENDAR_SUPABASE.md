# Migraciones SQL para Google Calendar - Supabase

Esta guía te ayudará a ejecutar las migraciones SQL necesarias para la integración con Google Calendar en Supabase.

## 📋 Archivos de Migración

Hay 2 archivos SQL que necesitas ejecutar:

1. `database/create_google_calendar_tokens.sql` - Crea la tabla para almacenar tokens OAuth
2. `database/add_google_calendar_fields_to_coordinaciones.sql` - Agrega campos a la tabla coordinaciones

## 🚀 Pasos para Ejecutar las Migraciones

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto
3. En el menú lateral izquierdo, haz clic en **"SQL Editor"** (ícono de terminal/código)
4. Haz clic en **"New query"** para crear una nueva consulta

### Paso 2: Ejecutar Primera Migración (Tabla de Tokens)

1. Abre el archivo `database/create_google_calendar_tokens.sql` en tu editor de código
2. **Copia TODO el contenido** del archivo (debe incluir las líneas `CREATE TABLE`, `CREATE INDEX`, y `COMMENT`)
3. **Pega el contenido** en el editor SQL de Supabase
4. Haz clic en **"Run"** (botón en la parte inferior) o presiona `Ctrl+Enter` (Windows/Linux) / `Cmd+Enter` (Mac)
5. ✅ Deberías ver un mensaje de éxito como: `Success. No rows returned`

**Contenido esperado del archivo:**
```sql
-- Tabla para almacenar tokens de OAuth de Google Calendar por DJ
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP NOT NULL,
  scope TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id)
);
-- ... (índices y comentarios)
```

### Paso 3: Ejecutar Segunda Migración (Campos en Coordinaciones)

1. Abre el archivo `database/add_google_calendar_fields_to_coordinaciones.sql` en tu editor de código
2. **Copia TODO el contenido** del archivo
3. En Supabase SQL Editor, haz clic en **"New query"** nuevamente (o limpia el editor anterior)
4. **Pega el contenido** en el editor SQL de Supabase
5. Haz clic en **"Run"** o presiona `Ctrl+Enter` / `Cmd+Enter`
6. ✅ Deberías ver un mensaje de éxito

**Contenido esperado del archivo:**
```sql
-- Agregar campos relacionados con Google Calendar a la tabla coordinaciones
ALTER TABLE coordinaciones 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS videollamada_agendada BOOLEAN DEFAULT false,
-- ... (más columnas e índices)
```

### Paso 4: Verificar que las Migraciones se Ejecutaron Correctamente

#### Verificar Tabla de Tokens

1. En Supabase, ve a **"Table Editor"** (menú lateral)
2. Deberías ver la nueva tabla `google_calendar_tokens` en la lista
3. Haz clic en ella para ver su estructura:
   - Debe tener columnas: `id`, `dj_id`, `access_token`, `refresh_token`, `expiry_date`, `scope`, `token_type`, `created_at`, `updated_at`

#### Verificar Campos en Coordinaciones

1. En **"Table Editor"**, haz clic en la tabla `coordinaciones`
2. Deberías ver las nuevas columnas al final de la lista:
   - `google_calendar_event_id` (VARCHAR)
   - `videollamada_agendada` (BOOLEAN)
   - `videollamada_fecha` (TIMESTAMP)
   - `videollamada_duracion` (INTEGER)
   - `videollamada_meet_link` (TEXT)

## ✅ Verificación Completa

Si todo está correcto:

- ✅ Tabla `google_calendar_tokens` existe
- ✅ Tabla `coordinaciones` tiene los 5 nuevos campos
- ✅ No hay errores en los mensajes de Supabase

## 🐛 Solución de Problemas

### Error: "relation already exists"

Si ves este error al crear la tabla `google_calendar_tokens`:
- **No es un problema**: La tabla ya existe, puedes continuar con la siguiente migración
- El `IF NOT EXISTS` debería prevenir esto, pero si ocurre, simplemente ignóralo

### Error: "column already exists"

Si ves este error al agregar columnas a `coordinaciones`:
- **No es un problema**: Las columnas ya existen, la migración ya se ejecutó antes
- Puedes verificar en Table Editor que las columnas estén presentes

### Error: "foreign key constraint"

Si ves un error sobre `REFERENCES djs(id)`:
- Verifica que la tabla `djs` exista en tu base de datos
- Si no existe, primero ejecuta el esquema principal (`database/schema.sql`)

### No veo las tablas/columnas en Table Editor

1. **Refresca la página** de Supabase (F5)
2. Si aún no aparecen, verifica que ejecutaste las migraciones correctamente:
   - Ve a **"SQL Editor"** → **"History"** (historial de consultas)
   - Deberías ver tus consultas ejecutadas con éxito

## 📝 Notas Importantes

- 🔒 **Seguridad**: Los tokens OAuth se almacenan en texto plano en la base de datos. En producción, considera encriptarlos.
- 💾 **Backup**: Supabase hace backups automáticos, pero siempre es bueno tener un backup manual antes de migraciones importantes.
- 🚀 **Performance**: Los índices creados mejoran el rendimiento de las consultas.

## 🎯 Siguiente Paso

Una vez completadas las migraciones, continúa con la [Guía de Configuración de Google Calendar](./GUIA_CONFIGURACION_GOOGLE_CALENDAR.md) para configurar las credenciales OAuth.

