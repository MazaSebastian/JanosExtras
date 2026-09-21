-- Tabla para almacenar bloques de horarios de disponibilidad por día
CREATE TABLE IF NOT EXISTS disponibilidad_bloques (
  id SERIAL PRIMARY KEY,
  dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
  salon_id INTEGER REFERENCES salones(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio VARCHAR(10) NOT NULL,
  hora_fin VARCHAR(10),
  estado VARCHAR(20) DEFAULT 'disponible', -- 'disponible', 'ocupado'
  coordinacion_id INTEGER REFERENCES coordinaciones(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disp_bloques_dj_fecha ON disponibilidad_bloques(dj_id, fecha);
CREATE INDEX IF NOT EXISTS idx_disp_bloques_coord ON disponibilidad_bloques(coordinacion_id);
