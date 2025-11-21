# Cómo Encontrar la Connection String en Supabase

## Estás en la página correcta ✅

Estás en: **Settings → Database**

## Pasos para encontrar la Connection String:

### 1. En la sección "Connection pooling configuration"
- Verás la pestaña **"Shared Pooler"** (ya está seleccionada)
- **Desplázate hacia abajo** en esa sección
- Busca un campo o sección que diga:
  - **"Connection string"**
  - **"Connection URI"**
  - **"URI"**
  - O un campo de texto con un ícono de "copiar" 📋

### 2. Si no la ves, busca en estas áreas:

**Opción A: Debajo de "Pool Size" y "Max Client Connections"**
- La connection string suele estar justo después de estos campos
- Puede estar en un formato como:
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  ```

**Opción B: En la parte superior de la página**
- A veces aparece en la sección "Database password"
- O justo después del título "Database"

**Opción C: Busca un botón o enlace**
- Puede haber un botón que diga "Show connection string"
- O un enlace "Copy connection string"

### 3. Formato que deberías ver:

La connection string se verá así:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

O también:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 4. Si encuentras `[password]` o `[YOUR-PASSWORD]`:

Necesitas reemplazarlo con tu contraseña real:
1. Ve a la sección **"Database password"** (arriba en la misma página)
2. Si no la recuerdas, haz clic en **"Reset database password"**
3. Guarda la nueva contraseña
4. Reemplaza `[password]` o `[YOUR-PASSWORD]` en la connection string

## Alternativa: Construir la Connection String Manualmente

Si no la encuentras, podemos construirla con:
- **Host**: `db.algsnpkssdvtyjbtcdbi.supabase.co` (o similar)
- **Port**: `5432` o `6543` (para pooling)
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: La que configuraste al crear el proyecto

¿Puedes hacer scroll hacia abajo en la sección "Connection pooling configuration" y decirme qué ves?

