-- Agregar campo codigo_evento a la tabla coordinaciones
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE coordinaciones 
ADD COLUMN IF NOT EXISTS codigo_evento VARCHAR(50);

COMMENT ON COLUMN coordinaciones.codigo_evento IS 'Código único del evento';

