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

  // Configuración optimizada para Vercel serverless
  // Si usas Supabase Connection Pooler, puede manejar más conexiones
  const isSupabasePooler = process.env.DATABASE_URL?.includes('pooler.supabase.com');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // En serverless, cada función tiene su propio pool
    // Supabase pooler puede manejar más conexiones concurrentes
    max: isSupabasePooler ? 2 : 1, // 2 conexiones si usas pooler, 1 si no
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Aumentado a 10s para evitar timeouts en picos
    // Configuraciones adicionales para mejor manejo de conexiones
    allowExitOnIdle: true, // Permite que la función termine cuando no hay conexiones activas
    // Timeout para queries individuales (30 segundos, menos que el timeout de Vercel)
    statement_timeout: 25000, // 25 segundos (menos que el timeout de función de 30s)
    query_timeout: 25000,
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

