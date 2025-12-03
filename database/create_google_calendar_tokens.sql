-- Tabla para almacenar tokens de OAuth de Google Calendar por DJ
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP NOT NULL,
  scope TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dj_id)
);

-- Índice para búsquedas rápidas por DJ
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_dj_id ON google_calendar_tokens(dj_id);

-- Comentarios
COMMENT ON TABLE google_calendar_tokens IS 'Almacena tokens de OAuth 2.0 para acceso a Google Calendar de cada DJ';
COMMENT ON COLUMN google_calendar_tokens.dj_id IS 'ID del DJ propietario del token';
COMMENT ON COLUMN google_calendar_tokens.access_token IS 'Token de acceso (encriptado en producción)';
COMMENT ON COLUMN google_calendar_tokens.refresh_token IS 'Token para renovar el access_token';
COMMENT ON COLUMN google_calendar_tokens.expiry_date IS 'Fecha de expiración del access_token';

