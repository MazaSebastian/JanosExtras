-- Agregar campos relacionados con Google Calendar a la tabla coordinaciones
ALTER TABLE coordinaciones 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS videollamada_agendada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS videollamada_fecha TIMESTAMP,
ADD COLUMN IF NOT EXISTS videollamada_duracion INTEGER DEFAULT 60, -- duración en minutos
ADD COLUMN IF NOT EXISTS videollamada_meet_link TEXT;

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_coordinaciones_google_calendar_event_id ON coordinaciones(google_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_videollamada_agendada ON coordinaciones(videollamada_agendada);
CREATE INDEX IF NOT EXISTS idx_coordinaciones_videollamada_fecha ON coordinaciones(videollamada_fecha);

-- Comentarios
COMMENT ON COLUMN coordinaciones.google_calendar_event_id IS 'ID del evento en Google Calendar';
COMMENT ON COLUMN coordinaciones.videollamada_agendada IS 'Indica si hay una videollamada agendada';
COMMENT ON COLUMN coordinaciones.videollamada_fecha IS 'Fecha y hora de la videollamada';
COMMENT ON COLUMN coordinaciones.videollamada_duracion IS 'Duración de la videollamada en minutos';
COMMENT ON COLUMN coordinaciones.videollamada_meet_link IS 'Link de Google Meet para la videollamada';

