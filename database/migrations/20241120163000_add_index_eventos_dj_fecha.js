exports.up = (pgm) => {
  pgm.createIndex('eventos', ['dj_id', 'fecha_evento'], {
    name: 'eventos_dj_fecha_idx',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('eventos', ['dj_id', 'fecha_evento'], {
    name: 'eventos_dj_fecha_idx',
  });
};

