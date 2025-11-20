// Configuración de base de datos
// Para usar PostgreSQL, configura la variable de entorno DATABASE_URL
// o establece USE_REAL_DB=true

import pkg from 'pg';
const { Pool } = pkg;
import jsonDB from './database.js';

const USE_REAL_DB = process.env.USE_REAL_DB === 'true' || !!process.env.DATABASE_URL;

let pool;

if (USE_REAL_DB) {
  // Usar PostgreSQL
  console.log('📊 Usando PostgreSQL');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false,
    max: 1, // Limitar conexiones en serverless
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('❌ Error en PostgreSQL:', err);
  });
} else {
  // Usar base de datos JSON (desarrollo)
  console.log('📄 Usando base de datos JSON (desarrollo)');
  pool = jsonDB;
}

export default pool;

