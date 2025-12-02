/**
 * Utilidades para formatear fechas desde la base de datos
 * Evita problemas de zona horaria formateando directamente desde strings YYYY-MM-DD
 */

/**
 * Formatea una fecha desde la base de datos evitando problemas de zona horaria
 * La fecha viene como string "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss.sssZ"
 * Formatea directamente desde el string sin crear objetos Date que puedan cambiar la fecha
 * 
 * @param {string|Date} fechaEvento - Fecha desde la base de datos
 * @returns {string} Fecha formateada como "DD/MM/YYYY"
 */
export function formatDateFromDB(fechaEvento) {
  if (!fechaEvento) return '';
  
  // Si es string, extraer solo la parte de fecha (YYYY-MM-DD)
  let fechaStr = fechaEvento;
  if (typeof fechaEvento === 'string') {
    // Extraer solo la parte de fecha (antes de T o espacio)
    fechaStr = fechaEvento.split('T')[0].split(' ')[0];
  } else if (fechaEvento instanceof Date) {
    // Si es Date, usar métodos UTC para evitar problemas de zona horaria
    const year = fechaEvento.getUTCFullYear();
    const month = String(fechaEvento.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fechaEvento.getUTCDate()).padStart(2, '0');
    fechaStr = `${year}-${month}-${day}`;
  }
  
  // Verificar formato YYYY-MM-DD
  if (!fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fechaEvento; // Devolver original si no coincide
  }
  
  // Formatear directamente desde el string: YYYY-MM-DD -> DD/MM/YYYY
  const [year, month, day] = fechaStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha desde la base de datos para input type="date"
 * Devuelve formato YYYY-MM-DD
 * 
 * @param {string|Date} fechaEvento - Fecha desde la base de datos
 * @returns {string} Fecha formateada como "YYYY-MM-DD"
 */
export function formatDateFromDBForInput(fechaEvento) {
  if (!fechaEvento) return '';
  
  // Si es string, extraer solo la parte de fecha (YYYY-MM-DD)
  let fechaStr = fechaEvento;
  if (typeof fechaEvento === 'string') {
    // Extraer solo la parte de fecha (antes de T o espacio)
    fechaStr = fechaEvento.split('T')[0].split(' ')[0];
  } else if (fechaEvento instanceof Date) {
    // Si es Date, usar métodos UTC para evitar problemas de zona horaria
    const year = fechaEvento.getUTCFullYear();
    const month = String(fechaEvento.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fechaEvento.getUTCDate()).padStart(2, '0');
    fechaStr = `${year}-${month}-${day}`;
  }
  
  // Verificar formato YYYY-MM-DD
  if (!fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fechaEvento; // Devolver original si no coincide
  }
  
  return fechaStr;
}

/**
 * Formatea una fecha desde la base de datos con formato largo
 * Devuelve formato "DD de MMMM de YYYY" (ej: "31 de diciembre de 2025")
 * 
 * @param {string|Date} fechaEvento - Fecha desde la base de datos
 * @returns {string} Fecha formateada
 */
export function formatDateFromDBLong(fechaEvento) {
  if (!fechaEvento) return '';
  
  // Si es string, extraer solo la parte de fecha (YYYY-MM-DD)
  let fechaStr = fechaEvento;
  if (typeof fechaEvento === 'string') {
    fechaStr = fechaEvento.split('T')[0].split(' ')[0];
  } else if (fechaEvento instanceof Date) {
    const year = fechaEvento.getUTCFullYear();
    const month = String(fechaEvento.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fechaEvento.getUTCDate()).padStart(2, '0');
    fechaStr = `${year}-${month}-${day}`;
  }
  
  // Verificar formato YYYY-MM-DD
  if (!fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fechaEvento;
  }
  
  const [year, month, day] = fechaStr.split('-');
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  return `${day} de ${monthNames[parseInt(month, 10) - 1]} de ${year}`;
}

