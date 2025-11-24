-- Base de datos para Sistema de Control de Eventos DJs
-- IMPORTANTE: Ejecuta TODO este script completo de una vez en Supabase SQL Editor

-- Paso 1: Crear tabla de Salones PRIMERO (no tiene dependencias)
CREATE TABLE IF NOT EXISTS salones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paso 2: Crear tabla de DJs (depende de salones)
CREATE TABLE IF NOT EXISTS djs (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'dj',
    color_hex VARCHAR(7),
    salon_id INTEGER REFERENCES salones(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paso 3: Crear tabla de Eventos (depende de djs y salones)
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
    salon_id INTEGER NOT NULL REFERENCES salones(id) ON DELETE CASCADE,
    fecha_evento DATE NOT NULL,
    confirmado BOOLEAN DEFAULT true,
    fecha_marcado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Evitar que un DJ marque dos veces el mismo salón en la misma fecha
    UNIQUE(dj_id, salon_id, fecha_evento)
);

-- Paso 4: Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_eventos_dj_id ON eventos(dj_id);
CREATE INDEX IF NOT EXISTS idx_eventos_salon_id ON eventos(salon_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_dj_fecha ON eventos(dj_id, fecha_evento);

CREATE TABLE IF NOT EXISTS fichadas (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    comentario TEXT,
    registrado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fichadas_tipo_check CHECK (tipo IN ('ingreso', 'egreso'))
);

CREATE INDEX IF NOT EXISTS idx_fichadas_dj_fecha ON fichadas(dj_id, registrado_en);

-- Paso 5: Insertar salones (ejecutar DESPUÉS de crear la tabla)
INSERT INTO salones (nombre, direccion) VALUES
    ('CABA Boutique', ''),
    ('Caballito 1', ''),
    ('Caballito 2', ''),
    ('Costanera 1', ''),
    ('Costanera 2', ''),
    ('Dardo Rocha', ''),
    ('Darwin 1', ''),
    ('Darwin 2', ''),
    ('Dot', ''),
    ('Lahusen', ''),
    ('Nuñez', ''),
    ('Palermo Hollywood', ''),
    ('Palermo Soho', ''),
    ('Puerto Madero', ''),
    ('Puerto Madero Boutique', ''),
    ('San Isidro', ''),
    ('San Telmo', ''),
    ('San Telmo 2', ''),
    ('San Telmo Boutique', ''),
    ('Vicente López', '')
ON CONFLICT (nombre) DO NOTHING;

-- Nota: Los DJs se registran a través de la API de registro
-- No se incluyen DJs de ejemplo por seguridad

-- Para bases ya creadas, ejecutar también:
-- ALTER TABLE djs ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'dj';
-- ALTER TABLE djs ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);

