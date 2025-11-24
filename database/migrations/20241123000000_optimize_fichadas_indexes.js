'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(`
    -- Índice compuesto para búsqueda rápida de última fichada por DJ
    CREATE INDEX IF NOT EXISTS idx_fichadas_dj_registro_desc 
    ON fichadas(dj_id, registrado_en DESC);
    
    -- Índice para búsquedas por rango de fechas
    CREATE INDEX IF NOT EXISTS idx_fichadas_registro_en 
    ON fichadas(registrado_en DESC);
    
    -- Índice para búsquedas por tipo (si se necesita filtrar)
    CREATE INDEX IF NOT EXISTS idx_fichadas_tipo 
    ON fichadas(tipo) WHERE tipo IS NOT NULL;
    
    -- Índice compuesto para DJ con salón (optimiza joins)
    CREATE INDEX IF NOT EXISTS idx_djs_salon_id 
    ON djs(salon_id) WHERE salon_id IS NOT NULL;
    
    -- Índice para coordenadas de salones (optimiza validación de geolocalización)
    CREATE INDEX IF NOT EXISTS idx_salones_coordenadas 
    ON salones(latitud, longitud) WHERE latitud IS NOT NULL AND longitud IS NOT NULL;
  `);
};

exports.down = function (db) {
  return db.runSql(`
    DROP INDEX IF EXISTS idx_fichadas_dj_registro_desc;
    DROP INDEX IF EXISTS idx_fichadas_registro_en;
    DROP INDEX IF EXISTS idx_fichadas_tipo;
    DROP INDEX IF EXISTS idx_djs_salon_id;
    DROP INDEX IF EXISTS idx_salones_coordenadas;
  `);
};

exports._meta = {
  version: 1,
};

