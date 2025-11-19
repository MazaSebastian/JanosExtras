# Sistema de Control de Eventos DJs

Sistema para controlar la cantidad de eventos realizados por cada DJ en diferentes salones.

## Características

- 🔐 Autenticación de DJs
- 🏢 Gestión de múltiples salones
- 📅 Calendario anual por salón
- ✅ Marcado de eventos realizados
- 📊 Reportes mensuales para cálculo de sueldos
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

