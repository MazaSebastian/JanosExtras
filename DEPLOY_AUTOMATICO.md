# Deploy Automático Configurado ✅

El sistema ahora está configurado para hacer deploy automático después de cada cambio.

## ¿Cómo funciona?

1. **Después de cada commit**: Se ejecuta automáticamente un hook de Git que hace push al repositorio
2. **Vercel detecta el push**: Vercel automáticamente detecta el cambio y comienza el deploy
3. **Deploy completo**: El sitio se actualiza en producción sin intervención manual

## Scripts Disponibles

### Deploy Automático (Recomendado)
```bash
npm run deploy
```
Este script hace commit y push automáticamente, lo que activa el deploy en Vercel.

### Deploy Directo (Vercel CLI)
```bash
npm run deploy:direct
```
Requiere tener Vercel CLI instalado y configurado. Hace deploy directo sin commit.

### Deploy Manual (Git)
```bash
npm run deploy:git
```
Ejecuta el script bash que hace commit y push manualmente.

## Configuración Actual

- ✅ Hook de Git configurado (`.git/hooks/post-commit`)
- ✅ Scripts de deploy creados (`scripts/deploy.sh`, `scripts/deploy-auto.js`)
- ✅ Scripts agregados al `package.json`

## Notas Importantes

1. **El hook solo funciona en la rama `main` o `master`** para evitar deploys accidentales en otras ramas
2. **Vercel debe estar conectado al repositorio** para que el deploy automático funcione
3. **El deploy puede tardar 1-3 minutos** dependiendo del tamaño del proyecto

## Desactivar Deploy Automático

Si necesitas desactivar el deploy automático temporalmente:

```bash
# Renombrar el hook (lo desactiva)
mv .git/hooks/post-commit .git/hooks/post-commit.disabled

# Para reactivarlo:
mv .git/hooks/post-commit.disabled .git/hooks/post-commit
```

## Ver Estado del Deploy

Puedes ver el estado del deploy en:
- Dashboard de Vercel: https://vercel.com
- O ejecutar: `vercel ls` (si tienes Vercel CLI instalado)

