import pool from '../frontend/src/lib/database-config.js';

async function run() {
  console.log('⏳ Iniciando migración de base de datos para Notificaciones Push...');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Crear tabla push_subscriptions
    console.log('Creating push_subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        dj_id INTEGER REFERENCES djs(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Agregar columnas a djs
    console.log('Adding notification setting columns to djs table...');
    await client.query(`
      ALTER TABLE djs ADD COLUMN IF NOT EXISTS notific_recordatorio_horas INTEGER DEFAULT 2;
    `);
    await client.query(`
      ALTER TABLE djs ADD COLUMN IF NOT EXISTS notific_reuniones_dia BOOLEAN DEFAULT TRUE;
    `);
    await client.query(`
      ALTER TABLE djs ADD COLUMN IF NOT EXISTS notific_precoordinacion_completada BOOLEAN DEFAULT TRUE;
    `);

    await client.query('COMMIT');
    console.log('✅ Migración aplicada exitosamente!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando migración:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
