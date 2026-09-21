import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  console.log('⏳ Iniciando migración para disponibilidad_bloques...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ No se encontró DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Creando tabla disponibilidad_bloques...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS disponibilidad_bloques (
            id SERIAL PRIMARY KEY,
            dj_id INTEGER NOT NULL REFERENCES djs(id) ON DELETE CASCADE,
            salon_id INTEGER REFERENCES salones(id) ON DELETE SET NULL,
            fecha DATE NOT NULL,
            hora_inicio VARCHAR(10) NOT NULL,
            hora_fin VARCHAR(10),
            estado VARCHAR(20) DEFAULT 'disponible',
            coordinacion_id INTEGER REFERENCES coordinaciones(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_disp_bloques_dj_fecha ON disponibilidad_bloques(dj_id, fecha);
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_disp_bloques_coord ON disponibilidad_bloques(coordinacion_id);
        `);

        await client.query('COMMIT');
        console.log('✅ Migración aplicada exitosamente en PostgreSQL!');
      await pool.end();
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
  } finally {
    process.exit(0);
  }
}

run();
