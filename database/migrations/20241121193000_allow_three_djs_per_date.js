exports.up = (pgm) => {
  pgm.dropConstraint('eventos', 'eventos_unique_salon_fecha');
  pgm.addConstraint('eventos', 'eventos_unique_dj_salon_fecha', {
    unique: ['dj_id', 'salon_id', 'fecha_evento'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('eventos', 'eventos_unique_dj_salon_fecha');
  pgm.addConstraint('eventos', 'eventos_unique_salon_fecha', {
    unique: ['salon_id', 'fecha_evento'],
  });
};


