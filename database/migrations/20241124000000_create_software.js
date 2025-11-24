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
    CREATE TABLE IF NOT EXISTS software (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      url_descarga TEXT NOT NULL,
      categoria VARCHAR(50),
      activo BOOLEAN DEFAULT true,
      creado_por INTEGER REFERENCES djs(id) ON DELETE SET NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_software_activo ON software(activo);
    CREATE INDEX IF NOT EXISTS idx_software_categoria ON software(categoria);
    CREATE INDEX IF NOT EXISTS idx_software_fecha_creacion ON software(fecha_creacion DESC);

    COMMENT ON TABLE software IS 'Catálogo de software para DJs';
    COMMENT ON COLUMN software.nombre IS 'Nombre del software';
    COMMENT ON COLUMN software.descripcion IS 'Descripción del software';
    COMMENT ON COLUMN software.url_descarga IS 'URL de descarga del software';
    COMMENT ON COLUMN software.categoria IS 'Categoría del software (ej: DAW, Plugin, Sample Pack, etc.)';
  `);
};

exports.down = function (db) {
  return db.runSql(`
    DROP TABLE IF EXISTS software;
  `);
};

exports._meta = {
  version: 1,
};

