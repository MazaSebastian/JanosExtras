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
    ALTER TABLE salones 
    ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8);
    
    COMMENT ON COLUMN salones.latitud IS 'Latitud del salón para validación de geolocalización';
    COMMENT ON COLUMN salones.longitud IS 'Longitud del salón para validación de geolocalización';
  `);
};

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE salones 
    DROP COLUMN IF EXISTS latitud,
    DROP COLUMN IF EXISTS longitud;
  `);
};

exports._meta = {
  version: 1,
};

