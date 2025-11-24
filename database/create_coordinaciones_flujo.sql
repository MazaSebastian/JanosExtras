-- Tabla para almacenar las respuestas del flujo de coordinación
-- Ejecutar este script en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coordinaciones_flujo (
  id SERIAL PRIMARY KEY,
  coordinacion_id INTEGER NOT NULL REFERENCES coordinaciones(id) ON DELETE CASCADE,
  paso_actual INTEGER NOT NULL DEFAULT 1,
  tipo_evento VARCHAR(50) NOT NULL,
  respuestas JSONB DEFAULT '{}',
  estado VARCHAR(50) DEFAULT 'en_proceso',
  completado BOOLEAN DEFAULT false,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_completado TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coordinaciones_flujo_coordinacion ON coordinaciones_flujo(coordinacion_id);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_flujo_estado ON coordinaciones_flujo(estado);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_flujo_tipo_evento ON coordinaciones_flujo(tipo_evento);

COMMENT ON TABLE coordinaciones_flujo IS 'Almacena el progreso y respuestas del flujo de coordinación por tipo de evento';

