exports.up = (pgm) => {
  // Create push_subscriptions table
  pgm.createTable('push_subscriptions', {
    id: 'id', // serial primary key
    dj_id: {
      type: 'integer',
      references: 'djs',
      onDelete: 'CASCADE',
    },
    endpoint: { type: 'text', notNull: true, unique: true },
    p256dh: { type: 'text', notNull: true },
    auth: { type: 'text', notNull: true },
    dispositivo: { type: 'text' },
    fecha_registro: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('push_subscriptions', 'dj_id');

  // Add columns to djs table
  pgm.addColumns('djs', {
    notific_recordatorio_horas: { type: 'integer', default: 2 },
    notific_reuniones_dia: { type: 'boolean', default: true },
    notific_precoordinacion_completada: { type: 'boolean', default: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('djs', [
    'notific_recordatorio_horas',
    'notific_reuniones_dia',
    'notific_precoordinacion_completada'
  ]);
  pgm.dropTable('push_subscriptions');
};
