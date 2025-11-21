exports.up = (pgm) => {
  pgm.createTable('salones', {
    id: 'id',
    nombre: { type: 'varchar(100)', notNull: true, unique: true },
    direccion: { type: 'text' },
    activo: { type: 'boolean', notNull: true, default: pgm.func('true') },
    fecha_creacion: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('djs', {
    id: 'id',
    nombre: { type: 'varchar(100)', notNull: true, unique: true },
    password: { type: 'varchar(255)', notNull: true },
    rol: { type: 'varchar(20)', notNull: true, default: 'dj' },
    color_hex: { type: 'varchar(7)' },
    salon_id: {
      type: 'integer',
      references: '"salones"',
      onDelete: 'set null',
    },
    fecha_registro: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('eventos', {
    id: 'id',
    dj_id: {
      type: 'integer',
      notNull: true,
      references: '"djs"',
      onDelete: 'cascade',
    },
    salon_id: {
      type: 'integer',
      notNull: true,
      references: '"salones"',
      onDelete: 'cascade',
    },
    fecha_evento: { type: 'date', notNull: true },
    confirmado: { type: 'boolean', notNull: true, default: pgm.func('true') },
    fecha_marcado: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('eventos', 'eventos_unique_salon_fecha', {
    unique: ['salon_id', 'fecha_evento'],
  });

  pgm.createIndex('eventos', 'dj_id');
  pgm.createIndex('eventos', 'salon_id');
  pgm.createIndex('eventos', 'fecha_evento');

  pgm.sql(`
    INSERT INTO salones (nombre, direccion, activo)
    VALUES
      ('CABA Boutique', ''),
      ('Caballito 1', ''),
      ('Caballito 2', ''),
      ('Costanera 1', ''),
      ('Costanera 2', ''),
      ('Dardo Rocha', ''),
      ('Darwin 1', ''),
      ('Darwin 2', ''),
      ('Dot', ''),
      ('Lahusen', ''),
      ('Nuñez', ''),
      ('Palermo Hollywood', ''),
      ('Palermo Soho', ''),
      ('Puerto Madero', ''),
      ('Puerto Madero Boutique', ''),
      ('San Isidro', ''),
      ('San Telmo', ''),
      ('San Telmo 2', ''),
      ('San Telmo Boutique', ''),
      ('Vicente López', '')
    ON CONFLICT (nombre) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('eventos');
  pgm.dropTable('djs');
  pgm.dropTable('salones');
};

