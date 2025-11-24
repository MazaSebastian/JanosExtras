exports.up = (pgm) => {
  pgm.createTable('fichadas', {
    id: 'id',
    dj_id: {
      type: 'integer',
      notNull: true,
      references: '"djs"',
      onDelete: 'cascade',
    },
    tipo: {
      type: 'varchar(20)',
      notNull: true,
    },
    comentario: {
      type: 'text',
    },
    registrado_en: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('fichadas', 'fichadas_tipo_check', {
    check: "tipo IN ('ingreso', 'egreso')",
  });

  pgm.createIndex('fichadas', ['dj_id', 'registrado_en']);
};

exports.down = (pgm) => {
  pgm.dropTable('fichadas');
};


