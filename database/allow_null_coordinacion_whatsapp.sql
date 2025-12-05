-- Migración para permitir conversaciones de WhatsApp sin coordinación asociada
-- Esto permite recibir mensajes de números que no están en ninguna coordinación

-- 1. Permitir coordinacion_id NULL en whatsapp_conversaciones
ALTER TABLE whatsapp_conversaciones 
  ALTER COLUMN coordinacion_id DROP NOT NULL;

-- 2. Agregar campo dj_id para asociar conversaciones sin coordinación a un DJ (puede ser NULL)
ALTER TABLE whatsapp_conversaciones 
  ADD COLUMN IF NOT EXISTS dj_id INTEGER REFERENCES djs(id) ON DELETE CASCADE;

-- 3. Modificar la restricción UNIQUE para permitir múltiples conversaciones sin coordinación
-- Primero eliminar la restricción existente
ALTER TABLE whatsapp_conversaciones 
  DROP CONSTRAINT IF EXISTS whatsapp_conversaciones_coordinacion_id_phone_number_key;

-- Crear nueva restricción que permite NULL en coordinacion_id
-- Solo aplica UNIQUE cuando coordinacion_id NO es NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_coordinacion_phone 
  ON whatsapp_conversaciones(coordinacion_id, phone_number) 
  WHERE coordinacion_id IS NOT NULL;

-- Crear índice para búsquedas por dj_id y phone_number (para conversaciones sin coordinación)
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_dj_phone 
  ON whatsapp_conversaciones(dj_id, phone_number) 
  WHERE coordinacion_id IS NULL AND dj_id IS NOT NULL;

-- 4. Permitir coordinacion_id NULL en whatsapp_mensajes también
ALTER TABLE whatsapp_mensajes 
  ALTER COLUMN coordinacion_id DROP NOT NULL;

-- 5. Índice para búsquedas por dj_id
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_dj_id 
  ON whatsapp_conversaciones(dj_id) 
  WHERE dj_id IS NOT NULL;

-- Comentarios
COMMENT ON COLUMN whatsapp_conversaciones.coordinacion_id IS 'ID de coordinación asociada (puede ser NULL para conversaciones sin coordinación)';
COMMENT ON COLUMN whatsapp_conversaciones.dj_id IS 'ID del DJ propietario (requerido si coordinacion_id es NULL)';
COMMENT ON COLUMN whatsapp_mensajes.coordinacion_id IS 'ID de coordinación asociada (puede ser NULL para mensajes sin coordinación)';

