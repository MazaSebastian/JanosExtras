import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'database.json');

// Inicializar base de datos si no existe
let db = {
  djs: [],
  salones: [
    { id: 1, nombre: 'Salón Principal', direccion: 'Av. Principal 123', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 2, nombre: 'Salón VIP', direccion: 'Calle VIP 456', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 3, nombre: 'Salón Terraza', direccion: 'Av. Terraza 789', activo: true, fecha_creacion: new Date().toISOString() }
  ],
  eventos: []
};

// Cargar base de datos desde archivo
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
  } catch (err) {
    console.log('Error al cargar base de datos, usando datos por defecto');
  }
}

// Guardar base de datos
const saveDB = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error al guardar base de datos:', err);
  }
};

// Simular Pool de PostgreSQL
export default {
  query: async (queryText, params = []) => {
    // Simular delay de base de datos
    await new Promise(resolve => setTimeout(resolve, 10));

    // Parsear query simple (solo para pruebas)
    const query = queryText.trim().toUpperCase();
    
    // SELECT queries
    if (query.startsWith('SELECT')) {
      if (query.includes('FROM DJS')) {
        if (query.includes('WHERE EMAIL')) {
          const email = params[0];
          const dj = db.djs.find(d => d.email === email);
          return { rows: dj ? [dj] : [] };
        }
        if (query.includes('WHERE ID')) {
          const id = parseInt(params[0]);
          const dj = db.djs.find(d => d.id === id);
          if (dj) {
            const { password, ...djWithoutPassword } = dj;
            return { rows: [djWithoutPassword] };
          }
          return { rows: [] };
        }
      }
      
      if (query.includes('FROM SALONES')) {
        if (query.includes('WHERE ID')) {
          const id = parseInt(params[0]);
          const salon = db.salones.find(s => s.id === id && s.activo);
          return { rows: salon ? [salon] : [] };
        }
        // SELECT * FROM salones WHERE activo = true
        const salones = db.salones.filter(s => s.activo);
        return { rows: salones };
      }
      
      if (query.includes('FROM EVENTOS')) {
        if (query.includes('EXTRACT(YEAR') && query.includes('EXTRACT(MONTH')) {
          // Eventos por salón y mes
          if (query.includes('INNER JOIN DJS')) {
            const salonId = parseInt(params[0]);
            const year = parseInt(params[1]);
            const month = parseInt(params[2]);
            const eventos = db.eventos
              .filter(e => {
                const fecha = new Date(e.fecha_evento);
                return e.salon_id === salonId && 
                       fecha.getFullYear() === year && 
                       fecha.getMonth() + 1 === month;
              })
              .map(e => {
                const dj = db.djs.find(d => d.id === e.dj_id);
                return {
                  ...e,
                  dj_nombre: dj?.nombre || '',
                  dj_email: dj?.email || ''
                };
              });
            return { rows: eventos };
          }
          // Eventos por DJ y mes
          if (query.includes('INNER JOIN SALONES')) {
            const djId = parseInt(params[0]);
            const year = parseInt(params[1]);
            const month = parseInt(params[2]);
            const eventos = db.eventos
              .filter(e => {
                const fecha = new Date(e.fecha_evento);
                return e.dj_id === djId && 
                       fecha.getFullYear() === year && 
                       fecha.getMonth() + 1 === month;
              })
              .map(e => {
                const salon = db.salones.find(s => s.id === e.salon_id);
                return {
                  ...e,
                  salon_nombre: salon?.nombre || ''
                };
              });
            return { rows: eventos };
          }
          // Resumen mensual
          if (query.includes('COUNT(*)')) {
            const djId = parseInt(params[0]);
            const year = parseInt(params[1]);
            const month = parseInt(params[2]);
            const eventos = db.eventos.filter(e => {
              const fecha = new Date(e.fecha_evento);
              return e.dj_id === djId && 
                     fecha.getFullYear() === year && 
                     fecha.getMonth() + 1 === month;
            });
            const salonesUnicos = new Set(eventos.map(e => e.salon_id));
            return {
              rows: [{
                total_eventos: eventos.length,
                total_salones: salonesUnicos.size
              }]
            };
          }
        }
        // Verificar si existe evento
        if (query.includes('WHERE DJ_ID') && query.includes('AND SALON_ID') && query.includes('AND FECHA_EVENTO')) {
          const djId = parseInt(params[0]);
          const salonId = parseInt(params[1]);
          const fecha = params[2];
          // Comparar solo la fecha (sin hora)
          const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha.split('T')[0];
          const evento = db.eventos.find(e => {
            const eFecha = e.fecha_evento.split('T')[0];
            return e.dj_id === djId && 
                   e.salon_id === salonId && 
                   eFecha === fechaStr;
          });
          return { rows: evento ? [evento] : [] };
        }
      }
    }
    
    // INSERT queries
    if (query.startsWith('INSERT')) {
      if (query.includes('INTO DJS')) {
        const newId = db.djs.length > 0 ? Math.max(...db.djs.map(d => d.id)) + 1 : 1;
        const newDJ = {
          id: newId,
          nombre: params[0],
          email: params[1],
          password: params[2],
          fecha_registro: new Date().toISOString()
        };
        db.djs.push(newDJ);
        saveDB();
        const { password, ...djWithoutPassword } = newDJ;
        return { rows: [djWithoutPassword] };
      }
      
      if (query.includes('INTO SALONES')) {
        const newId = db.salones.length > 0 ? Math.max(...db.salones.map(s => s.id)) + 1 : 1;
        const newSalon = {
          id: newId,
          nombre: params[0],
          direccion: params[1],
          activo: true,
          fecha_creacion: new Date().toISOString()
        };
        db.salones.push(newSalon);
        saveDB();
        return { rows: [newSalon] };
      }
      
      if (query.includes('INTO EVENTOS')) {
        const newId = db.eventos.length > 0 ? Math.max(...db.eventos.map(e => e.id)) + 1 : 1;
        // Asegurar que fecha_evento esté en formato YYYY-MM-DD
        let fechaEvento = params[2];
        if (fechaEvento instanceof Date) {
          fechaEvento = fechaEvento.toISOString().split('T')[0];
        } else if (fechaEvento.includes('T')) {
          fechaEvento = fechaEvento.split('T')[0];
        }
        const newEvent = {
          id: newId,
          dj_id: parseInt(params[0]),
          salon_id: parseInt(params[1]),
          fecha_evento: fechaEvento,
          confirmado: true,
          fecha_marcado: params[3] || new Date().toISOString()
        };
        db.eventos.push(newEvent);
        saveDB();
        return { rows: [newEvent] };
      }
    }
    
    // DELETE queries
    if (query.startsWith('DELETE')) {
      if (query.includes('FROM EVENTOS')) {
        const eventId = parseInt(params[0]);
        const djId = parseInt(params[1]);
        const index = db.eventos.findIndex(e => e.id === eventId && e.dj_id === djId);
        if (index !== -1) {
          const deleted = db.eventos[index];
          db.eventos.splice(index, 1);
          saveDB();
          return { rows: [deleted] };
        }
        return { rows: [] };
      }
    }
    
    return { rows: [] };
  }
};

console.log('✅ Base de datos simple inicializada (almacenamiento en archivo)');

