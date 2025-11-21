# Panel Administrativo

Este panel permite al gerente ver un resumen global de todos los DJs y salones.

## 1. Requisitos previos

1. La tabla `djs` debe tener la columna `rol` (ya se agregó al esquema).
   - Si tu base ya existía antes de este cambio, ejecuta en Supabase:
     ```sql
     ALTER TABLE djs ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'dj';
     UPDATE djs SET rol = 'dj' WHERE rol IS NULL;
     ```
2. Crear un usuario con rol `admin` (solo lectura/escritura general).

### Crear o actualizar el usuario gerente

Puedes hacerlo desde Supabase → Table Editor → `djs`:

1. Registra al gerente desde la app (para generar el hash de contraseña).
2. En la tabla `djs`, busca a ese usuario y cambia el valor de la columna `rol` a `admin`.
   - También puedes ejecutar:
     ```sql
     UPDATE djs SET rol = 'admin' WHERE nombre = 'NombreGerente';
     ```

## 2. Acceso al panel

- URL: `/admin`
- Solo usuarios con `rol = 'admin'` pueden ingresar.
- Después de iniciar sesión, si el usuario es admin se redirige automáticamente al panel.

## 3. Información mostrada

- Resumen global de DJs, salones y eventos del mes seleccionado.
- Tabla de DJs con eventos, extras y última fecha marcada.
- Tabla de salones con cantidad de eventos y DJs activos.

## 4. Seguridad

- Todas las rutas bajo `/api/admin/*` verifican el rol del usuario.
- Si un DJ tradicional intenta acceder, será redirigido a su dashboard habitual.

