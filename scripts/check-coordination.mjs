import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

const { default: pool } = await import('../frontend/src/lib/database-config.js');

async function check() {
  try {
    const res = await pool.query('SELECT c.id, c.titulo, c.nombre_cliente, c.nombre_agasajado, c.dj_responsable_id, c.pre_coordinacion_completado_por_cliente FROM coordinaciones c ORDER BY c.id DESC LIMIT 5');
    console.log('--- RECIENTES COORDINACIONES ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (pool.end) {
      pool.end();
    }
  }
}

check();
