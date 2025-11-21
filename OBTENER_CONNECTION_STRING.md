# Cómo Obtener la Connection String en Supabase

## Pasos Detallados:

### 1. Ir a Settings (Configuración)
- En la barra lateral izquierda, busca la sección **"CONFIGURATION"**
- Haz clic en **"Settings"** (ícono de engranaje ⚙️)

### 2. Ir a la pestaña Database
- En la parte superior de la página de Settings, verás varias pestañas:
  - General
  - **Database** ← Haz clic aquí
  - API
  - Auth
  - Storage
  - etc.

### 3. Buscar "Connection string"
- Una vez en la pestaña **Database**, desplázate hacia abajo
- Busca la sección **"Connection string"** o **"Connection pooling"**
- Verás un dropdown que dice algo como "Session mode" o "Transaction mode"
- Selecciona **"URI"** en el dropdown

### 4. Copiar la connection string
- Verás una cadena que se ve así:
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  ```
  O también puede ser:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
  ```

### 5. Obtener la contraseña
- Si la connection string tiene `[YOUR-PASSWORD]` o `[password]`, necesitas:
  - Ir a **Settings** → **General** (o buscar "Database Password")
  - O usar la contraseña que guardaste cuando creaste el proyecto
  - Reemplazar `[YOUR-PASSWORD]` con tu contraseña real

## Alternativa: Connection Pooling

Si no encuentras "Connection string", busca:
- **"Connection pooling"** 
- **"Database URL"**
- **"Connection info"**

En algunos casos, Supabase muestra la connection string en formato diferente. Busca cualquier campo que diga "postgresql://..."

## Si aún no la encuentras:

1. Ve a **Settings** → **General**
2. Busca la sección **"Database"** o **"Database Password"**
3. También puedes ir a **Settings** → **API** y buscar información de conexión allí

## Formato Final Necesario:

La connection string debe verse así:
```
postgresql://postgres:TU_PASSWORD_AQUI@db.xxxxx.supabase.co:5432/postgres
```

O con pooling:
```
postgresql://postgres.[ref]:TU_PASSWORD_AQUI@aws-0-[region].pooler.supabase.com:6543/postgres
```

