-- Migración para agregar campo teléfono a coordinaciones
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE coordinaciones
ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_coordinaciones_telefono ON coordinaciones(telefono) WHERE telefono IS NOT NULL;

COMMENT ON COLUMN coordinaciones.telefono IS 'Teléfono de contacto del cliente';

