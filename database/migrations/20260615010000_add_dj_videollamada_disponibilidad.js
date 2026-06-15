exports.up = (pgm) => {
  pgm.addColumns('djs', {
    disponibilidad_videollamada: { type: 'jsonb', default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('djs', ['disponibilidad_videollamada']);
};
