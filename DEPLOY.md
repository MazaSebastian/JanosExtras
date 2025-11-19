# Guía de Despliegue en Vercel

## Pasos para desplegar

### 1. Preparar el repositorio Git

```bash
# Inicializar Git (si no está inicializado)
git init

# Agregar el repositorio remoto
git remote add origin https://github.com/MazaSebastian/JanosExtras.git

# Agregar todos los archivos
git add .

# Hacer commit inicial
git commit -m "Initial commit: Sistema de control de eventos DJs"

# Subir al repositorio
git branch -M main
git push -u origin main
```

### 2. Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Haz clic en "Add New Project"
3. Importa el repositorio `JanosExtras`
4. **IMPORTANTE**: Antes de hacer clic en "Deploy", haz clic en "Configure Project"
5. Configura el proyecto:
   - **Framework Preset**: Next.js (debería detectarse automáticamente)
   - **Root Directory**: `frontend` ⚠️ **ESTO ES CRÍTICO - Debe estar configurado**
   - **Build Command**: `npm run build` (o dejar por defecto)
   - **Output Directory**: `.next` (o dejar por defecto)
6. Si ya desplegaste y falló, ve a Settings → General → Root Directory y cámbialo a `frontend`

### 3. Variables de Entorno

En la configuración del proyecto en Vercel, agrega estas variables de entorno:

- `JWT_SECRET`: Un secreto seguro para JWT (puedes generar uno con: `openssl rand -base64 32`)

### 4. Desplegar

Vercel desplegará automáticamente cuando hagas push al repositorio.

## Notas importantes

- **Base de datos**: Actualmente usa almacenamiento en archivo JSON. Para producción, considera migrar a una base de datos real (PostgreSQL, MongoDB, etc.)
- **Persistencia**: En Vercel, el sistema de archivos es efímero. Los datos se perderán en cada despliegue. Para producción, usa una base de datos externa.
- **API Routes**: Todas las rutas API están en `frontend/src/pages/api/`

## Migración a base de datos real

Para usar PostgreSQL u otra base de datos:

1. Configura una base de datos (ej: [Supabase](https://supabase.com), [PlanetScale](https://planetscale.com))
2. Actualiza `frontend/src/lib/database.js` para usar el cliente de la base de datos
3. Agrega las variables de conexión en Vercel

## Estructura del proyecto

```
/
├── frontend/          # Aplicación Next.js (desplegada en Vercel)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── api/   # API Routes (serverless functions)
│   │   │   └── ...    # Páginas React
│   │   └── lib/       # Modelos y utilidades
│   └── ...
├── backend/           # Backend Express (opcional, no usado en Vercel)
└── database/          # Scripts SQL
```

