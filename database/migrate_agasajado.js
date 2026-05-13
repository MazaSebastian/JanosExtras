const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/sebamaza/Desktop/SISTEMA EXTRAS JANOS/frontend/.env.local' });

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    const query = `
    ALTER TABLE coordinaciones 
    ADD COLUMN IF NOT EXISTS nombre_agasajado VARCHAR(200);
    
    COMMENT ON COLUMN coordinaciones.nombre_agasajado IS 'Nombre del agasajado principal del evento (excepto corporativos)';
  `;

    try {
        await pool.query(query);
        console.log('Migration successful: Added nombre_agasajado');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

runMigration();
