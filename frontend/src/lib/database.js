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
    { id: 20, nombre: 'Vicente López', direccion: '', activo: true, fecha_creacion: new Date().toISOString() },
    { id: 21, nombre: 'Recoleta', direccion: '', activo: true, fecha_creacion: new Date().toISOString() }
  ],
  eventos: [],
  disponibilidad_bloques: [],
  coordinaciones: []
};

// Cargar base de datos desde archivo
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
    db.disponibilidad_bloques = db.disponibilidad_bloques || [];
    db.coordinaciones = db.coordinaciones || [];
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
            
            // Filtrar eventos del DJ en el mes y año especificados
            const eventos = db.eventos.filter(e => {
              if (e.dj_id !== djId) return false;
              
              // Normalizar la fecha del evento
              let fechaEvento;
              if (typeof e.fecha_evento === 'string') {
                // Si es string, puede ser YYYY-MM-DD o ISO string
                const fechaStr = e.fecha_evento.split('T')[0];
                const [y, m, d] = fechaStr.split('-').map(Number);
                fechaEvento = new Date(y, m - 1, d);
              } else {
                fechaEvento = new Date(e.fecha_evento);
              }
              
              const eventoYear = fechaEvento.getFullYear();
              const eventoMonth = fechaEvento.getMonth() + 1;
              
              return eventoYear === year && eventoMonth === month;
            });
            
            const salonesUnicos = new Set(eventos.map(e => e.salon_id));
            const totalEventos = eventos.length;
            // Calcular eventos extras (a partir del evento 9, después de los 8 del sueldo base)
            const eventosExtras = Math.max(0, totalEventos - 8);
            
            // Log de debug
            if (process.env.NODE_ENV === 'development') {
              console.log(`📈 Resumen para DJ ${djId}, ${year}-${month}:`, {
                totalEventos,
                eventosExtras,
                eventos: eventos.map(e => ({ id: e.id, fecha: e.fecha_evento, salon: e.salon_id }))
              });
            }
            
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

      // Disponibilidad Bloques
      if (query.includes('FROM DISPONIBILIDAD_BLOQUES')) {
        const fecha = params[0];
        const djId = params[1] ? parseInt(params[1]) : null;
        let bloques = (db.disponibilidad_bloques || []).filter(b => {
          const matchFecha = String(b.fecha) === String(fecha);
          const matchDj = !djId || b.dj_id === djId;
          return matchFecha && matchDj;
        });
        bloques = bloques.map(b => {
          const coord = b.coordinacion_id ? (db.coordinaciones || []).find(c => c.id === b.coordinacion_id) : null;
          return {
            ...b,
            nombre_cliente: coord?.nombre_cliente || null,
            apellido_cliente: coord?.apellido_cliente || null,
            nombre_agasajado: coord?.nombre_agasajado || null,
            tipo_evento: coord?.tipo_evento || null,
            coordinacion_titulo: coord?.titulo || null,
            cliente_telefono: coord?.telefono || null,
            videollamada_completada: coord?.videollamada_completada || false
          };
        });
        return { rows: bloques };
      }
    }
    
    // INSERT queries
    if (query.startsWith('INSERT')) {
      if (query.includes('INTO DISPONIBILIDAD_BLOQUES')) {
        db.disponibilidad_bloques = db.disponibilidad_bloques || [];
        const newId = db.disponibilidad_bloques.length > 0 ? Math.max(...db.disponibilidad_bloques.map(b => b.id)) + 1 : 1;
        const newBlock = {
          id: newId,
          dj_id: parseInt(params[0]),
          salon_id: params[1] ? parseInt(params[1]) : null,
          fecha: params[2],
          hora_inicio: params[3],
          hora_fin: params[4] || null,
          estado: params[5] || 'disponible',
          coordinacion_id: params[6] ? parseInt(params[6]) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.disponibilidad_bloques.push(newBlock);
        saveDB();
        return { rows: [newBlock] };
      }

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
        } else if (fechaEvento && fechaEvento.includes('T')) {
          fechaEvento = fechaEvento.split('T')[0];
        }
        // Asegurar formato YYYY-MM-DD
        if (fechaEvento && !fechaEvento.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const fecha = new Date(fechaEvento);
          fechaEvento = fecha.toISOString().split('T')[0];
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
        
        // Log de debug
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Evento creado:', {
            id: newEvent.id,
            dj_id: newEvent.dj_id,
            salon_id: newEvent.salon_id,
            fecha_evento: newEvent.fecha_evento,
            total_eventos_dj: db.eventos.filter(e => e.dj_id === newEvent.dj_id).length
          });
        }
        
        return { rows: [newEvent] };
      }
    }

    // UPDATE queries
    if (query.startsWith('UPDATE')) {
      if (query.includes('UPDATE DISPONIBILIDAD_BLOQUES')) {
        db.disponibilidad_bloques = db.disponibilidad_bloques || [];
        if (query.includes("ESTADO = 'OCUPADO'")) {
          const coordId = parseInt(params[0]);
          const bloqueId = parseInt(params[1]);
          const b = db.disponibilidad_bloques.find(item => item.id === bloqueId);
          if (b) {
            b.estado = 'ocupado';
            b.coordinacion_id = coordId;
            b.updated_at = new Date().toISOString();
            saveDB();
            return { rows: [b] };
          }
        }
        if (query.includes("ESTADO = 'DISPONIBLE'")) {
          const coordId = parseInt(params[0]);
          const updated = [];
          db.disponibilidad_bloques.forEach(b => {
            if (b.coordinacion_id === coordId) {
              b.estado = 'disponible';
              b.coordinacion_id = null;
              b.updated_at = new Date().toISOString();
              updated.push(b);
            }
          });
          saveDB();
          return { rows: updated };
        }
      }
    }
    
    // DELETE queries
    if (query.startsWith('DELETE')) {
      if (query.includes('FROM DISPONIBILIDAD_BLOQUES')) {
        db.disponibilidad_bloques = db.disponibilidad_bloques || [];
        if (query.includes('WHERE ID = $1')) {
          const bloqueId = parseInt(params[0]);
          const idx = db.disponibilidad_bloques.findIndex(b => b.id === bloqueId);
          if (idx !== -1) {
            const del = db.disponibilidad_bloques.splice(idx, 1)[0];
            saveDB();
            return { rows: [del] };
          }
        }
        if (query.includes("ESTADO = 'DISPONIBLE'")) {
          const djId = parseInt(params[0]);
          const fecha = params[1];
          const remaining = [];
          const deleted = [];
          db.disponibilidad_bloques.forEach(b => {
            if (b.dj_id === djId && String(b.fecha) === String(fecha) && b.estado === 'disponible') {
              deleted.push(b);
            } else {
              remaining.push(b);
            }
          });
          db.disponibilidad_bloques = remaining;
          saveDB();
          return { rows: deleted };
        }
        return { rows: [] };
      }

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

