# Configuración de Geolocalización y Google Maps

## Paso 1: Ejecutar SQL en Supabase

1. Abrí https://supabase.com y accedé a tu proyecto
2. Ve a **SQL Editor** (en el menú lateral)
3. Copiá y pegá el siguiente SQL:

```sql
ALTER TABLE salones 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

COMMENT ON COLUMN salones.latitud IS 'Latitud del salón para validación de geolocalización';
COMMENT ON COLUMN salones.longitud IS 'Longitud del salón para validación de geolocalización';
```

4. Hacé clic en **Run** (o presioná Cmd/Ctrl + Enter)
5. Verificá que aparezca "Success. No rows returned"

## Paso 2: Obtener API Key de Google Maps

1. Ve a https://console.cloud.google.com/
2. Creá un nuevo proyecto o seleccioná uno existente
3. En el menú lateral, ve a **APIs & Services** > **Library**
4. Buscá "Maps JavaScript API" y hacé clic
5. Hacé clic en **Enable** para habilitar la API
6. Ve a **APIs & Services** > **Credentials**
7. Hacé clic en **Create Credentials** > **API Key**
8. Copiá la API Key generada
9. (Opcional pero recomendado) Hacé clic en **Restrict Key**:
   - En **Application restrictions**, seleccioná "HTTP referrers"
   - Agregá tu dominio: `janosdjs.com/*` y `*.vercel.app/*`
   - En **API restrictions**, seleccioná "Restrict key" y elegí "Maps JavaScript API"

## Paso 3: Configurar API Key en Vercel

1. Ve a https://vercel.com y accedé a tu proyecto `janos-extras`
2. Ve a **Settings** > **Environment Variables**
3. Hacé clic en **Add New**
4. Configurá:
   - **Name**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value**: Tu API Key de Google Maps (la que copiaste en el paso 2)
   - **Environment**: Seleccioná "Production", "Preview" y "Development"
5. Hacé clic en **Save**
6. **IMPORTANTE**: Hacé un redeploy para que tome la nueva variable:
   - Ve a **Deployments**
   - Hacé clic en los tres puntos (⋯) del último deployment
   - Seleccioná **Redeploy**

## Paso 4: Configurar Coordenadas de Salones

1. Accedé a `https://janosdjs.com/admin` como administrador
2. En el menú lateral, hacé clic en **Salones**
3. Para cada salón, hacé clic en el botón **📍 Configurar**
4. En el mapa que se abre:
   - Buscá la ubicación del salón (podés usar la búsqueda de Google Maps)
   - Hacé clic en el mapa para colocar el marcador en la ubicación exacta
   - También podés arrastrar el marcador para ajustarlo
5. Hacé clic en **Guardar coordenadas**

### Cómo obtener coordenadas precisas:

**Opción 1: Usando Google Maps (web)**
1. Abrí https://maps.google.com
2. Buscá la dirección del salón
3. Hacé clic derecho en el punto exacto
4. Hacé clic en las coordenadas que aparecen (ej: -34.603722, -58.381592)
5. Las coordenadas se copian automáticamente

**Opción 2: Usando la interfaz del admin**
- El mapa interactivo permite hacer clic directamente en la ubicación
- Las coordenadas se guardan automáticamente al hacer clic

## Paso 5: Probar la Funcionalidad

### Para DJs (Fichadas):
1. Accedé a `https://janosdjs.com/dashboard/fichadas` como DJ
2. Verificá que aparezca el mapa con:
   - Tu ubicación actual (marcador azul)
   - Ubicación del salón asignado (marcador rojo)
   - Distancia calculada entre ambas
3. Intentá marcar un ingreso:
   - El sistema pedirá permisos de geolocalización
   - Solo permitirá el ingreso si estás a menos de 100 metros del salón

### Para Administradores:
1. Verificá que en la sección **Salones** se muestren las coordenadas configuradas
2. Verificá que el mapa funcione correctamente al editar coordenadas

## Solución de Problemas

### El mapa no se muestra
- Verificá que la API Key esté configurada en Vercel
- Verificá que hayas hecho redeploy después de agregar la variable
- Verificá en la consola del navegador si hay errores de API

### Error "API key not valid"
- Verificá que la API Key esté correctamente copiada
- Verificá que la API "Maps JavaScript API" esté habilitada
- Verificá las restricciones de la API Key (si las configuraste)

### No puedo marcar ingreso aunque estoy cerca del salón
- Verificá que el salón tenga coordenadas configuradas
- Verificá que los permisos de geolocalización estén habilitados en tu navegador
- El radio permitido es de 100 metros

### Las coordenadas no se guardan
- Verificá que el SQL se haya ejecutado correctamente en Supabase
- Verificá que tengas permisos de administrador
- Revisá la consola del navegador para ver errores

## Notas Importantes

- **Radio de validación**: El sistema valida que el DJ esté a menos de 100 metros del salón para permitir el ingreso
- **Solo ingresos**: La validación de geolocalización solo se aplica a ingresos, no a egresos
- **Actualización en tiempo real**: El mapa en fichadas actualiza la ubicación del DJ automáticamente
- **Privacidad**: Las coordenadas solo se usan para validar la ubicación, no se almacenan en las fichadas

