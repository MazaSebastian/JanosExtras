// Configuración de PostgreSQL para producción
import pkg from 'pg';
const { Pool } = pkg;

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
  // Configuración para Vercel serverless
  max: 1, // Limitar conexiones en serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la base de datos PostgreSQL:', err);
});

// Para compatibilidad con el sistema actual
export default pool;

