exports.up = (pgm) => {
  pgm.addColumns('djs', {
    email: { type: 'varchar(100)', default: null },
    telefono: { type: 'varchar(50)', default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('djs', ['email', 'telefono']);
};
