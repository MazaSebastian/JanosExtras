# Obtener Connection String - Método Directo

## Opción 1: Ir a Database Settings (Recomendado)

1. En la barra lateral izquierda, busca la sección **"CONFIGURATION"**
2. Haz clic en **"Database"** (no en "API Keys")
3. Una vez en Database Settings:
   - Desplázate hacia abajo
   - Busca la sección **"Connection string"** o **"Connection info"**
   - O busca un campo que diga **"URI"**

## Opción 2: Construir la Connection String Manualmente

Si no encuentras la connection string en la interfaz, podemos construirla manualmente.

### Necesitas esta información:

1. **Project Reference ID**: Lo puedes ver en la URL de tu proyecto
   - En la URL: `supabase.com/dashboard/project/algsnpkssdvtyjbtcdbi/...`
   - Tu Project Reference es: `algsnpkssdvtyjbtcdbi`

2. **Database Password**: 
   - Ve a **Settings → Database** (en CONFIGURATION)
   - En la sección "Database password", si no la recuerdas, haz clic en "Reset database password"
   - Guarda la contraseña

3. **Region**: Generalmente está en Settings → General

### Formato de Connection String para Supabase:

```
postgresql://postgres:[TU_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

Reemplaza:
- `[TU_PASSWORD]` con tu contraseña de base de datos
- `[PROJECT_REF]` con `algsnpkssdvtyjbtcdbi`

### Ejemplo con tu proyecto:

```
postgresql://postgres:TU_PASSWORD_AQUI@db.algsnpkssdvtyjbtcdbi.supabase.co:5432/postgres
```

## Opción 3: Usar Connection Pooling (Recomendado para Vercel)

Para Vercel, es mejor usar connection pooling:

```
postgresql://postgres.[PROJECT_REF]:[TU_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Para obtener la región:
1. Ve a **Settings → General**
2. Busca "Region" o "Project region"

## Pasos Rápidos:

1. Ve a **Settings → Database** (en CONFIGURATION, barra lateral izquierda)
2. En la sección "Database password", anota o resetea tu contraseña
3. Construye la connection string con el formato de arriba
4. Reemplaza `[TU_PASSWORD]` con tu contraseña real

