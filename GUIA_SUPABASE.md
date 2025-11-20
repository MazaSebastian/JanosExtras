# Guía Paso a Paso: Migración a Supabase

## Paso 1: Crear Cuenta y Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** o **"Sign in"** si ya tienes cuenta
3. Inicia sesión con GitHub (recomendado) o crea cuenta con email
4. Una vez dentro, haz clic en **"New Project"**

### Configuración del Proyecto:

- **Name**: `janos-extras` (o el nombre que prefieras)
- **Database Password**: ⚠️ **GUARDA ESTA CONTRASEÑA** - la necesitarás después
- **Region**: Elige la más cercana (ej: `South America (São Paulo)`)
- **Pricing Plan**: Free (suficiente para empezar)
- Haz clic en **"Create new project"**

⏳ Espera 2-3 minutos mientras se crea el proyecto.

---

## Paso 2: Ejecutar el Esquema SQL

1. Una vez creado el proyecto, ve al menú lateral izquierdo
2. Haz clic en **"SQL Editor"** (ícono de terminal/código)
3. Haz clic en **"New query"**
4. Abre el archivo `database/schema.sql` de este proyecto
5. **Copia TODO el contenido** del archivo
6. **Pega el contenido** en el editor SQL de Supabase
7. Haz clic en **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`)

✅ Deberías ver un mensaje de éxito. Los salones deberían haberse insertado.

---

## Paso 3: Obtener las Credenciales de Conexión

1. En el menú lateral, ve a **"Settings"** (ícono de engranaje)
2. Haz clic en **"Database"**
3. Busca la sección **"Connection string"**
4. Selecciona **"URI"** en el dropdown
5. **Copia la connection string** - se verá así:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. **Reemplaza `[YOUR-PASSWORD]`** con la contraseña que guardaste en el Paso 1

Ejemplo final:
```
postgresql://postgres:tu_password_aqui@db.abcdefghijklmnop.supabase.co:5432/postgres
```

⚠️ **IMPORTANTE**: Esta es tu `DATABASE_URL`. Guárdala de forma segura.

---

## Paso 4: Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Selecciona tu proyecto `janos-extras`
3. Ve a **"Settings"** → **"Environment Variables"**
4. Haz clic en **"Add New"**
5. Agrega la variable:
   - **Name**: `DATABASE_URL`
   - **Value**: La connection string que copiaste (con la contraseña reemplazada)
   - **Environment**: Selecciona todas (Production, Preview, Development)
6. Haz clic en **"Save"**

---

## Paso 5: Redesplegar en Vercel

1. En Vercel, ve a **"Deployments"**
2. Haz clic en los **3 puntos** del último deployment
3. Selecciona **"Redeploy"**
4. O simplemente haz un push al repositorio:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for Supabase"
   git push
   ```

---

## Paso 6: Verificar que Funciona

1. Ve a tu aplicación en Vercel
2. Intenta registrarte como nuevo DJ
3. Marca algunos eventos
4. Verifica que el resumen mensual funcione correctamente

---

## Verificación en Supabase

Puedes verificar que los datos se están guardando:

1. En Supabase, ve a **"Table Editor"** (menú lateral)
2. Deberías ver las tablas: `djs`, `salones`, `eventos`
3. Al crear un DJ o evento, deberías verlo aparecer aquí

---

## Solución de Problemas

### Error: "Connection refused"
- Verifica que la `DATABASE_URL` esté correcta
- Asegúrate de haber reemplazado `[YOUR-PASSWORD]` con la contraseña real

### Error: "SSL required"
- La connection string ya incluye SSL, pero si hay problemas, agrega `?sslmode=require` al final

### Los datos no aparecen
- Verifica que el esquema SQL se ejecutó correctamente
- Revisa la consola del navegador para errores
- Verifica en Supabase Table Editor que los datos estén ahí

---

## Notas Importantes

- 🔒 **Seguridad**: Nunca subas la `DATABASE_URL` al repositorio
- 💾 **Backup**: Supabase hace backups automáticos en el plan gratuito
- 📊 **Límites**: El plan gratuito tiene límites, pero son generosos para empezar
- 🚀 **Performance**: Las consultas deberían ser más rápidas que con JSON

---

## ¿Necesitas Ayuda?

Si encuentras algún problema durante la migración, avísame y te ayudo a resolverlo.

