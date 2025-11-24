-- Agregar campos nombre_cliente y tipo_evento a la tabla coordinaciones
-- Ejecutar este script en Supabase SQL Editor

ALTER TABLE coordinaciones 
ADD COLUMN IF NOT EXISTS nombre_cliente VARCHAR(200),
ADD COLUMN IF NOT EXISTS tipo_evento VARCHAR(50);

COMMENT ON COLUMN coordinaciones.nombre_cliente IS 'Nombre del cliente para el evento';
COMMENT ON COLUMN coordinaciones.tipo_evento IS 'Tipo de evento: XV, Casamiento, Corporativo, Religioso, Cumpleaños';

