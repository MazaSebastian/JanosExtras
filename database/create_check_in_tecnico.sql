-- Tabla para Check-In Técnico de equipos de salones
CREATE TABLE IF NOT EXISTS check_in_tecnico (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
    salon_id INTEGER NOT NULL REFERENCES salones(id) ON DELETE CASCADE,
    evento_id INTEGER REFERENCES eventos(id) ON DELETE SET NULL,
    fecha_check_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    equipos JSONB NOT NULL, -- Almacena el estado de cada equipo: [{"nombre": "Pantalla", "estado": "ok"}, ...]
    observaciones TEXT,
    estado_general VARCHAR(20) DEFAULT 'ok', -- 'ok', 'observacion', 'reparar', 'no_aplica'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_check_in_tecnico_dj_id ON check_in_tecnico(dj_id);
CREATE INDEX IF NOT EXISTS idx_check_in_tecnico_salon_id ON check_in_tecnico(salon_id);
CREATE INDEX IF NOT EXISTS idx_check_in_tecnico_evento_id ON check_in_tecnico(evento_id);
CREATE INDEX IF NOT EXISTS idx_check_in_tecnico_fecha ON check_in_tecnico(fecha_check_in);
CREATE INDEX IF NOT EXISTS idx_check_in_tecnico_estado ON check_in_tecnico(estado_general);

COMMENT ON TABLE check_in_tecnico IS 'Registro de check-ins técnicos realizados por DJs después de eventos';
COMMENT ON COLUMN check_in_tecnico.dj_id IS 'ID del DJ que realizó el check-in';
COMMENT ON COLUMN check_in_tecnico.salon_id IS 'ID del salón donde se realizó el check-in';
COMMENT ON COLUMN check_in_tecnico.evento_id IS 'ID del evento asociado (opcional)';
COMMENT ON COLUMN check_in_tecnico.fecha_check_in IS 'Fecha y hora en que se realizó el check-in';
COMMENT ON COLUMN check_in_tecnico.equipos IS 'JSONB con la lista de equipos y sus estados: [{"nombre": "Pantalla", "estado": "ok", "observaciones": ""}, ...]';
COMMENT ON COLUMN check_in_tecnico.observaciones IS 'Observaciones generales del check-in';
COMMENT ON COLUMN check_in_tecnico.estado_general IS 'Estado general del check-in: ok (verde), observacion (amarillo), reparar (rojo), no_aplica (gris)';

