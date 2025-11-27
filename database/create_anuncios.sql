-- Tabla de anuncios para comunicación desde gerencia a DJs
CREATE TABLE IF NOT EXISTS anuncios (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
  prioridad VARCHAR(20) DEFAULT 'normal', -- baja, normal, alta, urgente
  activo BOOLEAN DEFAULT TRUE,
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP,
  creado_por INTEGER REFERENCES djs(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_anuncios_activo ON anuncios(activo);
CREATE INDEX IF NOT EXISTS idx_anuncios_fecha_inicio ON anuncios(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_anuncios_fecha_fin ON anuncios(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_anuncios_prioridad ON anuncios(prioridad);

-- Comentarios
COMMENT ON TABLE anuncios IS 'Anuncios enviados desde gerencia a los DJs';
COMMENT ON COLUMN anuncios.titulo IS 'Título del anuncio';
COMMENT ON COLUMN anuncios.mensaje IS 'Contenido del mensaje del anuncio';
COMMENT ON COLUMN anuncios.tipo IS 'Tipo de anuncio: info, warning, success, error';
COMMENT ON COLUMN anuncios.prioridad IS 'Prioridad: baja, normal, alta, urgente';
COMMENT ON COLUMN anuncios.activo IS 'Indica si el anuncio está activo y visible';
COMMENT ON COLUMN anuncios.fecha_inicio IS 'Fecha desde la cual el anuncio es visible';
COMMENT ON COLUMN anuncios.fecha_fin IS 'Fecha hasta la cual el anuncio es visible (NULL = sin límite)';
COMMENT ON COLUMN anuncios.creado_por IS 'ID del administrador que creó el anuncio';

