/**
 * Feriados Nacionales de Argentina
 * Incluye feriados fijos y móviles
 */

/**
 * Calcula la fecha de Pascua (domingo de resurrección) usando el algoritmo de Meeus/Jones/Butcher
 * @param {number} year - Año
 * @returns {Date} Fecha de Pascua
 */
function calcularPascua(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * Obtiene todos los feriados nacionales de Argentina para un año dado
 * @param {number} year - Año
 * @returns {Array<{date: Date, name: string, type: 'fijo' | 'móvil' | 'inmutable'}>}
 */
export function getFeriadosNacionales(year) {
  const feriados = [];

  // Feriados fijos (fecha exacta)
  // Nota: Algunos feriados pueden tener días puente según el calendario oficial
  const feriadosFijos = [
    { month: 0, day: 1, name: 'Año Nuevo', type: 'inmutable' },
    { month: 2, day: 24, name: 'Día Nacional de la Memoria por la Verdad y la Justicia', type: 'fijo' },
    { month: 3, day: 2, name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', type: 'fijo' },
    { month: 4, day: 1, name: 'Día del Trabajador', type: 'inmutable' },
    { month: 4, day: 25, name: 'Día de la Revolución de Mayo', type: 'fijo' },
    { month: 5, day: 20, name: 'Día Paso a la Inmortalidad del General Manuel Belgrano', type: 'fijo' },
    { month: 6, day: 9, name: 'Día de la Independencia', type: 'inmutable' },
    { month: 7, day: 17, name: 'Paso a la Inmortalidad del General José de San Martín', type: 'fijo' },
    { month: 9, day: 12, name: 'Día del Respeto a la Diversidad Cultural', type: 'fijo' },
    { month: 11, day: 8, name: 'Día de la Inmaculada Concepción de María', type: 'inmutable' },
    { month: 11, day: 25, name: 'Navidad', type: 'inmutable' },
  ];

  feriadosFijos.forEach(({ month, day, name, type }) => {
    const date = new Date(year, month, day);
    feriados.push({ date, name, type });
  });

  // Feriados móviles (dependen de Pascua)
  const pascua = calcularPascua(year);
  
  // Viernes Santo (2 días antes de Pascua)
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  feriados.push({
    date: viernesSanto,
    name: 'Viernes Santo',
    type: 'móvil',
  });

  // Feriados puente (pueden variar por año, pero generalmente son los mismos)
  // Estos se calculan según reglas específicas del gobierno argentino
  // Por ahora, los incluimos como fijos conocidos para los próximos años

  // Ordenar por fecha
  feriados.sort((a, b) => a.date.getTime() - b.date.getTime());

  return feriados;
}

/**
 * Verifica si una fecha es feriado nacional
 * @param {Date} date - Fecha a verificar
 * @returns {{isHoliday: boolean, name?: string}} Información del feriado si existe
 */
export function esFeriado(date) {
  if (!date) return { isHoliday: false };
  
  const year = date.getFullYear();
  const feriados = getFeriadosNacionales(year);
  
  const dateKey = formatDateKey(date);
  
  for (const feriado of feriados) {
    if (formatDateKey(feriado.date) === dateKey) {
      return {
        isHoliday: true,
        name: feriado.name,
        type: feriado.type,
      };
    }
  }
  
  return { isHoliday: false };
}

/**
 * Formatea una fecha como clave (YYYY-MM-DD)
 * @param {Date} date - Fecha
 * @returns {string} Clave formateada
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene todos los feriados para un rango de años
 * @param {number} startYear - Año inicial
 * @param {number} endYear - Año final
 * @returns {Map<string, {name: string, type: string}>} Mapa de fechas (YYYY-MM-DD) a información del feriado
 */
export function getFeriadosMap(startYear, endYear) {
  const map = new Map();
  
  for (let year = startYear; year <= endYear; year++) {
    const feriados = getFeriadosNacionales(year);
    feriados.forEach((feriado) => {
      const key = formatDateKey(feriado.date);
      map.set(key, {
        name: feriado.name,
        type: feriado.type,
      });
    });
  }
  
  return map;
}

