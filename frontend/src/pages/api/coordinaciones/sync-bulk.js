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
  } else {
    // Autenticar mediante JWT estándar
    const auth = authenticateToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }
    userId = auth.user.id;
  }

  try {
    const { eventos } = req.body;
    if (!eventos || !Array.isArray(eventos)) {
      return res.status(400).json({ error: 'El cuerpo de la petición debe contener un array "eventos"' });
    }

    // Obtener salones para mapear nombres a IDs
    const salonesRes = await pool.query('SELECT id, nombre FROM salones');
    const salonesMap = {};
    salonesRes.rows.forEach(s => {
      salonesMap[s.nombre.toLowerCase().trim()] = s.id;
    });

    const report = {
      recibidos: eventos.length,
      creados: 0,
      actualizados: 0,
      errores: []
    };

    for (const ev of eventos) {
      try {
        const { 
          codigo_evento, 
          fecha_evento, 
          salon_nombre, 
          tipo_evento, 
          nombre_cliente,
          apellido_cliente,
          nombre_agasajado,
          telefono,
          notas
        } = ev;

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

        // Buscar si ya existe la coordinación
        const existingRes = await pool.query(
          'SELECT id FROM coordinaciones WHERE codigo_evento = $1 LIMIT 1',
          [codigo_evento]
        );

        if (existingRes.rows.length > 0) {
          // Actualizar coordinación existente
          const existing = existingRes.rows[0];
          const updateQuery = `
            UPDATE coordinaciones
            SET 
              fecha_evento = COALESCE($2, fecha_evento),
              salon_id = COALESCE($3, salon_id),
              tipo_evento = COALESCE($4, tipo_evento),
              nombre_cliente = COALESCE($5, nombre_cliente),
              apellido_cliente = COALESCE($6, apellido_cliente),
              nombre_agasajado = COALESCE($7, nombre_agasajado),
              telefono = COALESCE($8, telefono),
              notas = COALESCE($9, notas),
              fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $1
          `;
          await pool.query(updateQuery, [
            existing.id,
            fechaNormalizada,
            salonId,
            tipo_evento || null,
            nombre_cliente || null,
            apellido_cliente || null,
            nombre_agasajado || null,
            telefono || null,
            notas || null
          ]);
          report.actualizados++;
        } else {
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
            userId, // Asignar al creador
            userId,
            notas || null
          ]);
          report.creados++;
        }
      } catch (err) {
        console.error('Error procesando evento en sync-bulk:', ev, err);
        report.errores.push({ evento: ev, error: err.message });
      }
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('Error general en endpoint sync-bulk:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la sincronización' });
  }
}
