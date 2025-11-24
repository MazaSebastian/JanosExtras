-- Tabla para almacenar adicionales técnicos por salón y fecha
CREATE TABLE IF NOT EXISTS adicionales_tecnica (
  id SERIAL PRIMARY KEY,
  salon_id INTEGER NOT NULL REFERENCES salones(id) ON DELETE CASCADE,
  fecha_evento DATE NOT NULL,
  adicionales JSONB NOT NULL DEFAULT '{}',
  -- JSONB estructura: {"chispas": true, "humo": false, "lasers": true, "otros": "descripción"}
  notas TEXT,
  archivo_pdf_url TEXT,
  creado_por INTEGER REFERENCES djs(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, fecha_evento)
);

CREATE INDEX IF NOT EXISTS idx_adicionales_salon_id ON adicionales_tecnica(salon_id);
CREATE INDEX IF NOT EXISTS idx_adicionales_fecha_evento ON adicionales_tecnica(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_adicionales_salon_fecha ON adicionales_tecnica(salon_id, fecha_evento);

COMMENT ON TABLE adicionales_tecnica IS 'Almacena información de adicionales técnicos (chispas, humo, lasers, etc.) por salón y fecha';
COMMENT ON COLUMN adicionales_tecnica.adicionales IS 'JSONB con los adicionales disponibles: {"chispas": boolean, "humo": boolean, "lasers": boolean, "otros": string}';

