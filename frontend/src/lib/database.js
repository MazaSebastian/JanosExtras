// Copiar la configuración de base de datos simple al frontend
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Para Vercel, usar /tmp para escritura (nota: se limpia entre invocaciones)
// Para producción real, usar una base de datos externa
const getDataDir = () => {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDir = '/tmp/data';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};

const DATA_DIR = getDataDir();
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Inicializar base de datos si no existe
let db = {
  djs: [],
  salones: [
    { id: 1, nombre: 'CABA Boutique', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 2, nombre: 'Caballito 1', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 3, nombre: 'Caballito 2', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 4, nombre: 'Costanera 1', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 5, nombre: 'Costanera 2', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 6, nombre: 'Dardo Rocha', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 7, nombre: 'Darwin 1', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 8, nombre: 'Darwin 2', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 9, nombre: 'Dot', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 10, nombre: 'Lahusen', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 11, nombre: 'Nuñez', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 12, nombre: 'Palermo Hollywood', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 13, nombre: 'Palermo Soho', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 14, nombre: 'Puerto Madero', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 15, nombre: 'Puerto Madero Boutique', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 16, nombre: 'San Isidro', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 17, nombre: 'San Telmo', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 18, nombre: 'San Telmo 2', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 19, nombre: 'San Telmo Boutique', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 20, nombre: 'Vicente López', direccion: '', activo: true, fecha_creacion: new Date().toISOString() }
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
    await new Promise(resolve => setTimeout(resolve, 10));

    const query = queryText.trim().toUpperCase();
    
    // SELECT queries
    if (query.startsWith('SELECT')) {
      if (query.includes('FROM DJS')) {
        if (query.includes('WHERE NOMBRE')) {
          const nombre = params[0];
          const dj = db.djs.find(d => d.nombre === nombre);
          return { rows: dj ? [dj] : [] };
        }
        if (query.includes('WHERE ID')) {
          const id = parseInt(params[0]);
          const dj = db.djs.find(d => d.id === id);
          if (dj) {
            const { password, ...djWithoutPassword } = dj;
            // Asegurar que salon_id esté incluido
            return { rows: [{ ...djWithoutPassword, salon_id: dj.salon_id || null }] };
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
        const salones = db.salones.filter(s => s.activo);
        return { rows: salones };
      }
      
      if (query.includes('FROM EVENTOS')) {
        if (query.includes('EXTRACT(YEAR') && query.includes('EXTRACT(MONTH')) {
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
                  dj_id: e.dj_id,
                  dj_salon_id: dj?.salon_id || null
                };
              });
            return { rows: eventos };
          }
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
            const totalEventos = eventos.length;
            // Calcular eventos extras (a partir del evento 9, después de los 8 del sueldo base)
            const eventosExtras = Math.max(0, totalEventos - 8);
            return {
              rows: [{
                total_eventos: totalEventos,
                total_salones: salonesUnicos.size,
                eventos_extras: eventosExtras
              }]
            };
          }
        }
        // Verificar si existe evento para esa fecha y salón (cualquier DJ)
        // Query: SELECT id, dj_id FROM eventos WHERE salon_id = $1 AND fecha_evento = $2
        if (query.includes('WHERE SALON_ID') && query.includes('AND FECHA_EVENTO') && query.includes('SELECT ID, DJ_ID')) {
          const salonId = parseInt(params[0]);
          const fecha = params[1];
          const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha.split('T')[0];
          const evento = db.eventos.find(e => {
            const eFecha = e.fecha_evento.split('T')[0];
            return e.salon_id === salonId && eFecha === fechaStr;
          });
          return { rows: evento ? [{ id: evento.id, dj_id: evento.dj_id }] : [] };
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
          password: params[1],
          salon_id: params[2] || null,
          fecha_registro: params[3] || new Date().toISOString()
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

