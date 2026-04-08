// PostgreSQL via Supabase Transaction Pooler
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Error en la base de datos:', err);
});

export default pool;
