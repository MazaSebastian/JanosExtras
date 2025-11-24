-- Migración para crear tabla de Coordinaciones
-- Ejecutar este script en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coordinaciones (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_evento DATE,
  hora_evento TIME,
  salon_id INTEGER REFERENCES salones(id) ON DELETE SET NULL,
  dj_responsable_id INTEGER REFERENCES djs(id) ON DELETE SET NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  prioridad VARCHAR(20) DEFAULT 'normal',
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  creado_por INTEGER REFERENCES djs(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coordinaciones_activo ON coordinaciones(activo);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_estado ON coordinaciones(estado);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_fecha_evento ON coordinaciones(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_dj_responsable ON coordinaciones(dj_responsable_id);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_salon ON coordinaciones(salon_id);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_fecha_creacion ON coordinaciones(fecha_creacion DESC);

COMMENT ON TABLE coordinaciones IS 'Coordinaciones y comunicaciones entre DJs';
COMMENT ON COLUMN coordinaciones.titulo IS 'Título de la coordinación';
COMMENT ON COLUMN coordinaciones.descripcion IS 'Descripción detallada';
COMMENT ON COLUMN coordinaciones.fecha_evento IS 'Fecha del evento relacionado';
COMMENT ON COLUMN coordinaciones.hora_evento IS 'Hora del evento';
COMMENT ON COLUMN coordinaciones.salon_id IS 'Salón relacionado (opcional)';
COMMENT ON COLUMN coordinaciones.dj_responsable_id IS 'DJ responsable de la coordinación';
COMMENT ON COLUMN coordinaciones.estado IS 'Estado: pendiente, en_proceso, completada, cancelada';
COMMENT ON COLUMN coordinaciones.prioridad IS 'Prioridad: baja, normal, alta, urgente';

