-- Migración para agregar campos de Pre-Coordinación
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE coordinaciones
ADD COLUMN IF NOT EXISTS pre_coordinacion_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS pre_coordinacion_url TEXT,
ADD COLUMN IF NOT EXISTS pre_coordinacion_fecha_creacion TIMESTAMP,
ADD COLUMN IF NOT EXISTS pre_coordinacion_completado_por_cliente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pre_coordinacion_fecha_completado TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_coordinaciones_pre_coordinacion_token ON coordinaciones(pre_coordinacion_token) WHERE pre_coordinacion_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coordinaciones_pre_coordinacion_completado ON coordinaciones(pre_coordinacion_completado_por_cliente) WHERE pre_coordinacion_completado_por_cliente = true;

COMMENT ON COLUMN coordinaciones.pre_coordinacion_token IS 'Token único para acceso público a la pre-coordinación';
COMMENT ON COLUMN coordinaciones.pre_coordinacion_url IS 'URL completa para compartir con el cliente';
COMMENT ON COLUMN coordinaciones.pre_coordinacion_fecha_creacion IS 'Fecha en que se generó la pre-coordinación';
COMMENT ON COLUMN coordinaciones.pre_coordinacion_completado_por_cliente IS 'Indica si el cliente ya completó la pre-coordinación';
COMMENT ON COLUMN coordinaciones.pre_coordinacion_fecha_completado IS 'Fecha en que el cliente completó la pre-coordinación';

