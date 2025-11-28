// Configuración de PostgreSQL para producción
import pkg from 'pg';
const { Pool } = pkg;

// Configuración optimizada para Vercel serverless
// Si usas Supabase Connection Pooler, puede manejar más conexiones
const isSupabasePooler = process.env.DATABASE_URL?.includes('pooler.supabase.com');

// Configuración de conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si tienes variables separadas, puedes usar:
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT || 5432,
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false,
  max: isSupabasePooler ? 2 : 1, // 2 conexiones si usas pooler, 1 si no
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentado a 10s para evitar timeouts en picos
  allowExitOnIdle: true, // Permite que la función termine cuando no hay conexiones activas
  // Timeout para queries individuales (30 segundos, menos que el timeout de Vercel)
  statement_timeout: 25000, // 25 segundos (menos que el timeout de función de 30s)
  query_timeout: 25000,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la base de datos PostgreSQL:', err);
});

// Para compatibilidad con el sistema actual
export default pool;

