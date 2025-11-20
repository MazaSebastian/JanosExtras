-- ============================================
-- ESQUEMA COMPLETO PARA SUPABASE
-- Ejecuta TODO este script de una vez
-- ============================================

-- Paso 1: Crear tabla de Salones (debe ir PRIMERO)
CREATE TABLE IF NOT EXISTS salones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paso 2: Crear tabla de DJs (depende de salones)
CREATE TABLE IF NOT EXISTS djs (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
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
    -- Evitar que dos DJs marquen la misma fecha en el mismo salón
    UNIQUE(salon_id, fecha_evento)
);

-- Paso 4: Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_eventos_dj_id ON eventos(dj_id);
CREATE INDEX IF NOT EXISTS idx_eventos_salon_id ON eventos(salon_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_dj_fecha ON eventos(dj_id, fecha_evento);

-- Paso 5: Insertar salones (solo si no existen)
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

-- ============================================
-- ¡Listo! Las tablas están creadas y los salones insertados
-- ============================================

