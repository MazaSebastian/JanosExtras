import pool from '@/lib/database-config.js';
import { authenticateToken } from '@/lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // 1. Autenticación (Soporta JWT del usuario o el Cron Secret para mayor flexibilidad)
  let userId = null;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token === process.env.CRON_SECRET || token === 'janos_cron_secret_push_notif_2026_secure') {
    // Autenticado mediante el Secret
    userId = 37; // Usar ID de Admin o por defecto
    console.log('[Sync Bulk API] Authenticated via Cron/Admin Secret. Assigned userId:', userId);
  } else {
    // Autenticar mediante JWT estándar
    const auth = authenticateToken(req);
    if (auth.error) {
      console.warn('[Sync Bulk API] JWT Auth error:', auth.error);
      return res.status(auth.status).json({ error: auth.error });
    }
    userId = auth.user.id;
    console.log('[Sync Bulk API] Authenticated via JWT. Decoded user:', auth.user);
  }

  try {
    const { eventos } = req.body;
    if (!eventos || !Array.isArray(eventos)) {
      console.warn('[Sync Bulk API] Invalid payload - missing eventos array');
      return res.status(400).json({ error: 'El cuerpo de la petición debe contener un array "eventos"' });
    }

    console.log(`[Sync Bulk API] Starting sync for ${eventos.length} events (user ID: ${userId})`);

    // Obtener salones para mapear nombres a IDs
    const salonesRes = await pool.query('SELECT id, nombre FROM salones');
    const salonesMap = {};
    salonesRes.rows.forEach(s => {
      salonesMap[s.nombre.toLowerCase().trim()] = s.id;
    });

    // Obtener DJs mapeados por salon_id para asignación inteligente por salón
    const djsRes = await pool.query("SELECT id, salon_id FROM djs WHERE rol = 'dj'");
    const salonDjsMap = {};
    djsRes.rows.forEach(d => {
      if (d.salon_id) {
        salonDjsMap[d.salon_id] = d.id;
      }
    });

    const report = {
      recibidos: eventos.length,
      creados: 0,
      actualizados: 0,
      duplicados: 0,
      errores: []
    };

    for (const ev of eventos) {
      try {
        const truncateStr = (val, maxLen) => {
          if (!val) return null;
          return String(val).substring(0, maxLen).trim();
        };

        const codigo_evento = ev.codigo_evento;
        const fecha_evento = ev.fecha_evento;
        const salon_nombre = ev.salon_nombre;
        const tipo_evento = truncateStr(ev.tipo_evento, 190);
        const nombre_cliente = truncateStr(ev.nombre_cliente, 190);
        const apellido_cliente = truncateStr(ev.apellido_cliente, 190);
        const nombre_agasajado = truncateStr(ev.nombre_agasajado, 190);
        const telefono = truncateStr(ev.telefono, 45);
        const notas = truncateStr(ev.notas, 950);

        if (!codigo_evento) {
          report.errores.push({ evento: ev, error: 'Falta codigo_evento' });
          continue;
        }

        // Normalizar fecha de DD-MM-YYYY a YYYY-MM-DD
        let fechaNormalizada = null;
        if (fecha_evento) {
          const parts = fecha_evento.split(/[-/]/);
          if (parts.length === 3) {
            // Asumiendo DD-MM-YYYY
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            fechaNormalizada = `${year}-${month}-${day}`;
          }
        }

        // Resolver salon_id
        let salonId = null;
        if (salon_nombre) {
          salonId = salonesMap[salon_nombre.toLowerCase().trim()] || null;
        }

        // Determinar DJ responsable: priorizar el asignado a ese salón en particular, si no usar el userId
        const djResponsableId = (salonId && salonDjsMap[salonId]) ? salonDjsMap[salonId] : userId;

        // Buscar si ya existe la coordinación
        const existingRes = await pool.query(
          'SELECT id FROM coordinaciones WHERE codigo_evento = $1 LIMIT 1',
          [codigo_evento]
        );

        if (existingRes.rows.length > 0) {
          // Omitir reemplazo de información para evitar pérdida de coordinaciones realizadas
          report.duplicados++;
          continue;
        }

        // Crear nueva coordinación
        const nombreCompleto = [nombre_cliente, apellido_cliente].filter(Boolean).join(' ');
        const tituloFinal = nombreCompleto ? `${nombreCompleto} - ${tipo_evento || 'Evento'}` : `Evento ${codigo_evento}`;
        const insertQuery = `
          INSERT INTO coordinaciones (
            titulo, nombre_cliente, apellido_cliente, nombre_agasajado, 
            telefono, tipo_evento, codigo_evento, 
            fecha_evento, salon_id, dj_responsable_id, estado, 
            prioridad, creado_por, activo, videollamada_agendada, 
            videollamada_completada, notas
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9, $10, 'pendiente', 'normal', $11, true, false, false, $12)
        `;
        await pool.query(insertQuery, [
          tituloFinal,
          nombre_cliente || null,
          apellido_cliente || null,
          nombre_agasajado || null,
          telefono || null,
          tipo_evento || null,
          codigo_evento,
          fechaNormalizada,
          salonId,
          djResponsableId, // Asignación inteligente por salón
          userId,          // Creado por
          notas || null
        ]);
        report.creados++;

        // Asegurar la existencia del evento en la tabla 'eventos' para que se muestre en el calendario
        if (salonId && fechaNormalizada && djResponsableId) {
          const eventCheck = await pool.query(
            'SELECT id FROM eventos WHERE dj_id = $1 AND salon_id = $2 AND DATE(fecha_evento) = $3 LIMIT 1',
            [djResponsableId, salonId, fechaNormalizada]
          );

          if (eventCheck.rows.length === 0) {
            const countForSalonRes = await pool.query(
              'SELECT COUNT(*) FROM eventos WHERE salon_id = $1 AND DATE(fecha_evento) = $2',
              [salonId, fechaNormalizada]
            );
            const currentCount = parseInt(countForSalonRes.rows[0].count, 10);

            if (currentCount < 3) {
              const fechaMarcado = new Date().toISOString();
              await pool.query(
                `INSERT INTO eventos (dj_id, salon_id, fecha_evento, confirmado, fecha_marcado, is_new_assignment)
                 VALUES ($1, $2, $3, true, $4, false)`,
                [djResponsableId, salonId, fechaNormalizada, fechaMarcado]
              );
              console.log(`[Sync Bulk API] Auto-created calendar event for DJ ${djResponsableId}, salon ${salonId}, date ${fechaNormalizada}`);
            } else {
              console.warn(`[Sync Bulk API] Cannot auto-create calendar event: salon ${salonId} already has 3 DJs assigned on ${fechaNormalizada}`);
            }
          }
        }
      } catch (err) {
        console.error('Error procesando evento en sync-bulk:', ev, err);
        report.errores.push({ evento: ev, error: err.message });
      }
    }

    console.log('[Sync Bulk API] Finished sync. Report:', report);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error general en endpoint sync-bulk:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la sincronización' });
  }
}
