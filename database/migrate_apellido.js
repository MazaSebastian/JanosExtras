const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/sebamaza/Desktop/SISTEMA EXTRAS JANOS/frontend/.env.local' });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      ALTER TABLE coordinaciones 
      ADD COLUMN IF NOT EXISTS apellido_cliente VARCHAR(200);
      COMMENT ON COLUMN coordinaciones.apellido_cliente IS 'Apellido del cliente (separado del nombre para mensajería personalizada)';
    `);
    console.log('Migration OK: Added apellido_cliente');
  } catch (e) { console.error(e); }
  process.exit(0);
}
run();
