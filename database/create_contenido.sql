-- Migración para crear tabla de Contenido
-- Ejecutar este script en Supabase SQL Editor

-- Tabla de Contenido (visuales, packs de música, remixes, etc.)
CREATE TABLE IF NOT EXISTS contenido (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  url_descarga TEXT NOT NULL,
  categoria VARCHAR(50),
  tipo VARCHAR(50), -- 'visual', 'pack_musica', 'remix', 'otro'
  activo BOOLEAN DEFAULT true,
  creado_por INTEGER REFERENCES djs(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contenido_activo ON contenido(activo);
CREATE INDEX IF NOT EXISTS idx_contenido_categoria ON contenido(categoria);
CREATE INDEX IF NOT EXISTS idx_contenido_tipo ON contenido(tipo);
CREATE INDEX IF NOT EXISTS idx_contenido_fecha_creacion ON contenido(fecha_creacion DESC);

COMMENT ON TABLE contenido IS 'Catálogo de contenido útil para DJs (visuales, packs de música, remixes, etc.)';
COMMENT ON COLUMN contenido.nombre IS 'Nombre del contenido';
COMMENT ON COLUMN contenido.descripcion IS 'Descripción del contenido';
COMMENT ON COLUMN contenido.url_descarga IS 'URL de descarga del contenido';
COMMENT ON COLUMN contenido.categoria IS 'Categoría del contenido';
COMMENT ON COLUMN contenido.tipo IS 'Tipo de contenido (visual, pack_musica, remix, otro)';

