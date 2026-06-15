const { Client } = require('pg');

const connectionString = 'postgresql://postgres.algsnpkssdvtyjbtcdbi:NinaSebaMaza4794!@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();

    console.log('--- Eventos rows and their linked tipo_evento ---');
    const result = await client.query(`
      SELECT 
        e.id as event_id, 
        e.fecha_evento as event_date, 
        c.id as coord_id, 
        c.tipo_evento, 
        c.titulo
      FROM eventos e
      LEFT JOIN coordinaciones c ON DATE(e.fecha_evento) = DATE(c.fecha_evento) AND e.salon_id = c.salon_id
    `);

    const noCoord = [];
    const withReunion = [];
    const withRealEvent = [];

    result.rows.forEach(row => {
      if (!row.coord_id) {
        noCoord.push(row);
      } else if (row.tipo_evento === 'Reunión' || (row.tipo_evento && row.tipo_evento.toLowerCase().includes('reuni'))) {
        withReunion.push(row);
      } else {
        withRealEvent.push(row);
      }
    });

    console.log('Total event rows:', result.rows.length);
    console.log('Events with no coordination:', noCoord.length);
    console.log('Events with Reunión coordination:', withReunion.length);
    console.log('Events with real event types:', withRealEvent.length);

    if (noCoord.length > 0) {
      console.log('\nSample events with no coordination:');
      console.log(noCoord.slice(0, 10));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

run();
