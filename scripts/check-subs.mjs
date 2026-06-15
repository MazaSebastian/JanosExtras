import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Importar dinámicamente después de dotenv
const { default: pool } = await import('../frontend/src/lib/database-config.js');

async function check() {
  try {
    const res = await pool.query('SELECT ps.*, d.nombre, d.rol FROM push_subscriptions ps LEFT JOIN djs d ON ps.dj_id = d.id');
    console.log('--- SUCRIPCIONES DE NOTIFICACIONES PUSH REGISTRADAS ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
    const djsRes = await pool.query('SELECT id, nombre, rol, notific_precoordinacion_completada FROM djs');
    console.log('--- CONFIGURACIONES DE DJs ---');
    console.log(JSON.stringify(djsRes.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (pool.end) {
      pool.end();
    }
  }
}

check();
