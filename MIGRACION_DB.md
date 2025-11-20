# Guía de Migración a Base de Datos Real

## ¿Por qué migrar?

El sistema actual usa almacenamiento en JSON en memoria, que tiene limitaciones:
- ❌ Los datos se pierden en Vercel (el sistema de archivos es efímero)
- ❌ No hay garantías de consistencia con múltiples usuarios
- ❌ No escala para producción
- ❌ Cálculos pueden ser incorrectos sin transacciones

## Opciones Recomendadas

### 1. Supabase (Recomendado) ⭐

**Ventajas:**
- ✅ PostgreSQL completo y gratuito
- ✅ Fácil integración con Vercel
- ✅ Panel de administración incluido
- ✅ Autenticación opcional (aunque ya tienes JWT)
- ✅ Backup automático

**Pasos:**

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Ir a SQL Editor y ejecutar el contenido de `database/schema.sql`
4. Obtener las credenciales de conexión (Settings → Database → Connection string)

### 2. Neon

**Ventajas:**
- ✅ PostgreSQL serverless
- ✅ Compatible con Vercel
- ✅ Plan gratuito generoso

**Pasos:**

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear proyecto
3. Ejecutar `database/schema.sql` en el SQL Editor
4. Obtener connection string

### 3. Turso (SQLite)

**Ventajas:**
- ✅ Muy ligero
- ✅ Serverless
- ⚠️ Requiere cambios en el esquema (SQLite vs PostgreSQL)

## Pasos para Migrar

### Paso 1: Configurar Base de Datos

1. Elige una opción (recomendamos Supabase)
2. Crea el proyecto y ejecuta `database/schema.sql`
3. Obtén las credenciales de conexión

### Paso 2: Instalar Dependencias

```bash
cd frontend
npm install pg
```

La dependencia `pg` ya está incluida en el `package.json`.

### Paso 3: Configurar Variables de Entorno

En Vercel, agrega estas variables:

**Para Supabase/Neon (PostgreSQL):**
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

**O variables separadas:**
```
DB_HOST=your-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true
```

### Paso 4: Actualizar Código

El código ya está preparado. Solo necesitas:

1. Los modelos ya usan `database-config.js` que detecta automáticamente si usar PostgreSQL o JSON
2. Cuando configures `DATABASE_URL`, automáticamente usará PostgreSQL
3. Si quieres forzar PostgreSQL, agrega `USE_REAL_DB=true` a las variables de entorno

### Paso 5: Probar Localmente

```bash
# Agregar .env.local en frontend/
DATABASE_URL=tu-connection-string

# Probar
npm run dev
```

## Sistema Automático

El sistema detecta automáticamente qué base de datos usar:

- **Si `DATABASE_URL` está configurado** → Usa PostgreSQL
- **Si no** → Usa JSON (desarrollo)

No necesitas cambiar código. Solo configura las variables de entorno.

## Verificación

Después de migrar:

1. ✅ Verifica que los eventos se guarden correctamente
2. ✅ Verifica que el conteo mensual funcione
3. ✅ Verifica que los eventos extras se calculen bien
4. ✅ Prueba con múltiples usuarios simultáneos

## Rollback

Si necesitas volver al sistema JSON:

1. Cambia las importaciones de `database-pg.js` a `database.js`
2. Los datos en la base de datos real se mantendrán

## Notas Importantes

- 🔒 **Seguridad**: Nunca subas las credenciales de la base de datos al repositorio
- 💾 **Backup**: Configura backups automáticos en tu proveedor
- 📊 **Monitoreo**: Revisa el uso de recursos en el panel de tu proveedor
- 🚀 **Performance**: Los índices en el esquema SQL mejoran las consultas

