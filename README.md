# Sistema de Control de Eventos DJs

Sistema para controlar la cantidad de eventos realizados por cada DJ en diferentes salones.

## Características

- 🔐 Autenticación de DJs
- 🏢 Gestión de múltiples salones
- 📅 Calendario anual por salón
- ✅ Marcado y liberación de eventos por DJ
- 📊 Reportes mensuales para cálculo de sueldos
- 🧑‍💼 Panel administrativo exclusivo para gerencia
- 🚀 Desplegado en Vercel

## Instalación Local

1. Instalar dependencias:
```bash
cd frontend
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run dev
```

3. Abrir en el navegador: http://localhost:3000

## Despliegue en Vercel

Ver [DEPLOY.md](./DEPLOY.md) para instrucciones detalladas.

### Resumen rápido:

1. Conectar el repositorio con Vercel
2. Configurar Root Directory: `frontend`
3. Agregar variable de entorno: `JWT_SECRET`
4. Desplegar

## Estructura

- `frontend/` - Aplicación Next.js con API Routes (desplegada en Vercel)
  - `src/pages/api/` - API Routes (serverless functions)
  - `src/lib/` - Modelos y utilidades
  - `src/components/` - Componentes React
- `backend/` - API Node.js/Express (opcional, para desarrollo local)
- `database/` - Scripts SQL (para migración futura)

## Tecnologías

- Frontend: Next.js, React
- Backend: Next.js API Routes (serverless)
- Base de datos: JSON file (desarrollo) / PostgreSQL (producción recomendado)
- Autenticación: JWT
- Despliegue: Vercel

## Repositorio

GitHub: https://github.com/MazaSebastian/JanosExtras.git

## Notas Importantes

- **Base de datos actual**: Usa almacenamiento en archivo JSON para desarrollo
- **Producción**: Se recomienda migrar a PostgreSQL, MongoDB u otra base de datos real
- **Persistencia en Vercel**: Los archivos en `/tmp` se limpian entre invocaciones. Para producción real, usar base de datos externa.
- **Panel admin**: ver [ADMIN_DASHBOARD.md](./ADMIN_DASHBOARD.md) para crear usuarios gerente y habilitar el panel.
- **Migraciones**: las migraciones versionadas viven en `database/migrations/` y se ejecutan con `npm run db:migrate`. Asegúrate de tener `DATABASE_URL` configurado (por ejemplo en un `.env` en la raíz).

### Migraciones

1. Crea un archivo `.env` en la raíz con tu cadena de conexión:
   ```
   DATABASE_URL=postgresql://usuario:password@host:5432/base?sslmode=require
   ```
2. Aplicar migraciones pendientes:
   ```bash
   npm run db:migrate
   ```
3. Crear una nueva migración (el nombre va después de `--`):
   ```bash
   npm run db:new -- agregar-tabla-x
   ```
   Esto genera un archivo en `database/migrations/` para que agregues los cambios en `exports.up/exports.down`.
4. Si necesitas revertir la última migración:
   ```bash
   npm run db:rollback
   ```

