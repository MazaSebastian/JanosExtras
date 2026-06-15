import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Importar dinámicamente después de dotenv
const { enviarNotificacionPrecoordinacion } = await import('../frontend/src/lib/pushNotifier.js');

async function test() {
  console.log('Sending test push notification for coordination ID 198...');
  try {
    await enviarNotificacionPrecoordinacion(198);
    console.log('Finished executing enviarNotificacionPrecoordinacion.');
  } catch (error) {
    console.error('Failed to execute test push:', error);
  }
}

test();
