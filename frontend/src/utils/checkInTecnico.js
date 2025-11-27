// Lista de equipos técnicos por defecto
export const EQUIPOS_DEFAULT = [
  'Pantalla',
  'Splitter',
  'Sonido PA',
  'Parlantes Sub',
  'Mixer',
  'Cables',
  'Micrófonos',
  'Luces',
  'Proyector',
  'Escenario',
];

// Estados posibles
export const ESTADOS = {
  OK: 'ok',
  OBSERVACION: 'observacion',
  REPARAR: 'reparar',
  NO_APLICA: 'no_aplica',
};

// Función para obtener el color de un estado
export const getEstadoColor = (estado) => {
  switch (estado) {
    case ESTADOS.OK:
      return '#4caf50'; // Verde
    case ESTADOS.OBSERVACION:
      return '#ff9800'; // Amarillo/Naranja
    case ESTADOS.REPARAR:
      return '#f44336'; // Rojo
    case ESTADOS.NO_APLICA:
      return '#9e9e9e'; // Gris
    default:
      return '#9e9e9e';
  }
};

// Función para obtener el label de un estado
export const getEstadoLabel = (estado) => {
  switch (estado) {
    case ESTADOS.OK:
      return 'OK';
    case ESTADOS.OBSERVACION:
      return 'Observación';
    case ESTADOS.REPARAR:
      return 'Reparar';
    case ESTADOS.NO_APLICA:
      return 'No Aplica';
    default:
      return estado;
  }
};

// Función para calcular el estado general basado en los equipos
export const calcularEstadoGeneral = (equipos) => {
  if (!equipos || equipos.length === 0) return ESTADOS.OK;
  
  const estados = equipos.map(e => e.estado);
  
  // Si hay algún equipo que necesita reparación, el estado general es "reparar"
  if (estados.includes(ESTADOS.REPARAR)) {
    return ESTADOS.REPARAR;
  }
  
  // Si hay alguna observación, el estado general es "observacion"
  if (estados.includes(ESTADOS.OBSERVACION)) {
    return ESTADOS.OBSERVACION;
  }
  
  // Si todos están OK o No aplica, el estado general es "ok"
  if (estados.every(e => e === ESTADOS.OK || e === ESTADOS.NO_APLICA)) {
    return ESTADOS.OK;
  }
  
  return ESTADOS.OK;
};

