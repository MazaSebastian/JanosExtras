exports.up = (pgm) => {
  pgm.createTable('disponibilidad_bloques', {
    id: 'id', // serial primary key
    dj_id: {
      type: 'integer',
      notNull: true,
      references: 'djs',
      onDelete: 'CASCADE',
    },
    salon_id: {
      type: 'integer',
      references: 'salones',
      onDelete: 'SET NULL',
    },
    fecha: {
      type: 'date',
      notNull: true,
    },
    hora_inicio: {
      type: 'varchar(10)',
      notNull: true,
    },
    hora_fin: {
      type: 'varchar(10)',
    },
    estado: {
      type: 'varchar(20)',
      default: 'disponible',
    },
    coordinacion_id: {
      type: 'integer',
      references: 'coordinaciones',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  pgm.createIndex('disponibilidad_bloques', ['dj_id', 'fecha'], { ifNotExists: true, name: 'idx_disp_bloques_dj_fecha' });
  pgm.createIndex('disponibilidad_bloques', 'coordinacion_id', { ifNotExists: true, name: 'idx_disp_bloques_coord' });
};

exports.down = (pgm) => {
  pgm.dropTable('disponibilidad_bloques', { ifExists: true, cascade: true });
};
