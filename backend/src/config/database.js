// Usar base de datos simple para pruebas (sin PostgreSQL)
// Para usar PostgreSQL, cambia esta importación a: import pool from './database-pg.js';
import pool from './database-simple.js';

export default pool;

