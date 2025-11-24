'use strict';

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE IF NOT EXISTS shows (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      url_audio TEXT NOT NULL,
      duracion INTEGER,
      categoria VARCHAR(50),
      activo BOOLEAN DEFAULT true,
      creado_por INTEGER REFERENCES djs(id) ON DELETE SET NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_shows_activo ON shows(activo);
    CREATE INDEX IF NOT EXISTS idx_shows_categoria ON shows(categoria);
    CREATE INDEX IF NOT EXISTS idx_shows_fecha_creacion ON shows(fecha_creacion DESC);

    COMMENT ON TABLE shows IS 'Catálogo de pistas de audio para shows en vivo';
    COMMENT ON COLUMN shows.nombre IS 'Nombre de la pista';
    COMMENT ON COLUMN shows.descripcion IS 'Descripción de la pista';
    COMMENT ON COLUMN shows.url_audio IS 'URL del archivo de audio';
    COMMENT ON COLUMN shows.duracion IS 'Duración en segundos';
    COMMENT ON COLUMN shows.categoria IS 'Categoría de la pista (ej: Intro, Outro, Transición, etc.)';
  `);
};

exports.down = function (db) {
  return db.runSql(`
    DROP TABLE IF EXISTS shows;
  `);
};

exports._meta = {
  version: 1,
};

