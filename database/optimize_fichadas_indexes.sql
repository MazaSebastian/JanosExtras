-- Optimización de índices para fichadas
-- Ejecutar este script en Supabase SQL Editor

-- Índice compuesto para búsqueda rápida de última fichada por DJ
CREATE INDEX IF NOT EXISTS idx_fichadas_dj_registro_desc 
ON fichadas(dj_id, registrado_en DESC);

-- Índice para búsquedas por rango de fechas
CREATE INDEX IF NOT EXISTS idx_fichadas_registro_en 
ON fichadas(registrado_en DESC);

-- Índice compuesto para DJ con salón (optimiza joins)
CREATE INDEX IF NOT EXISTS idx_djs_salon_id 
ON djs(salon_id) WHERE salon_id IS NOT NULL;

-- Índice para coordenadas de salones (optimiza validación de geolocalización)
CREATE INDEX IF NOT EXISTS idx_salones_coordenadas 
ON salones(latitud, longitud) WHERE latitud IS NOT NULL AND longitud IS NOT NULL;

