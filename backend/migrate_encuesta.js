import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Agregando columnas de encuesta a la tabla coordinaciones...');

        // Add columns
        await client.query(`
      ALTER TABLE coordinaciones 
      ADD COLUMN IF NOT EXISTS encuesta_completada BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS encuesta_respuestas JSONB;
    `);

        await client.query('COMMIT');
        console.log('✅ Migración exitosa: Columnas agregadas.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en la migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
