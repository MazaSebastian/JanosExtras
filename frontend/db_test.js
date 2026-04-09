const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/sebamaza/Desktop/SISTEMA EXTRAS JANOS/frontend/.env.local' });

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const result = await pool.query('SELECT id, dj_id, salon_id FROM eventos WHERE id = 334');
    console.log('Event 334:', result.rows[0]);
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    process.exit(0);
  }
}

test();
