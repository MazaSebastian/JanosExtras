-- Agregar columnas de coordenadas a la tabla salones
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE salones 
ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);

COMMENT ON COLUMN salones.latitud IS 'Latitud del salón para validación de geolocalización';
COMMENT ON COLUMN salones.longitud IS 'Longitud del salón para validación de geolocalización';

-- Nota: Después de ejecutar este script, los administradores deberán configurar
-- las coordenadas de cada salón usando Google Maps o similar.
-- Las coordenadas deben estar en formato decimal (ej: -34.603722, -58.381592 para Buenos Aires)

