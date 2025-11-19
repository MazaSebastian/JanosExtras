-- Base de datos para Sistema de Control de Eventos DJs

-- Crear base de datos (ejecutar manualmente si es necesario)
-- CREATE DATABASE sistema_djs;

-- Tabla de DJs
CREATE TABLE IF NOT EXISTS djs (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Salones
CREATE TABLE IF NOT EXISTS salones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Eventos
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
    salon_id INTEGER NOT NULL REFERENCES salones(id) ON DELETE CASCADE,
    fecha_evento DATE NOT NULL,
    confirmado BOOLEAN DEFAULT true,
    fecha_marcado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dj_id, salon_id, fecha_evento)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_eventos_dj_id ON eventos(dj_id);
CREATE INDEX IF NOT EXISTS idx_eventos_salon_id ON eventos(salon_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_dj_fecha ON eventos(dj_id, fecha_evento);

-- Datos de ejemplo (opcional)
-- Insertar algunos salones de ejemplo
INSERT INTO salones (nombre, direccion) VALUES
    ('Salón Principal', 'Av. Principal 123'),
    ('Salón VIP', 'Calle VIP 456'),
    ('Salón Terraza', 'Av. Terraza 789')
ON CONFLICT DO NOTHING;

-- Nota: Los DJs se registran a través de la API de registro
-- No se incluyen DJs de ejemplo por seguridad

