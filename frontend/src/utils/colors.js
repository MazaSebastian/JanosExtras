// Generar un color único y consistente basado en el ID del Salón
// Cada salón tiene un color asignado, y todos los DJs de ese salón comparten el mismo color

const colorPalette = [
  '#667eea', // Azul púrpura - Salón Principal
  '#f093fb', // Rosa - Salón VIP
  '#4facfe', // Azul claro - Salón Terraza
  '#43e97b', // Verde
  '#fa709a', // Rosa coral
  '#fee140', // Amarillo
  '#30cfd0', // Cian
  '#a8edea', // Turquesa claro
  '#ff9a9e', // Rosa suave
  '#fecfef', // Rosa pastel
  '#fad0c4', // Melocotón
  '#ffd1ff', // Lavanda
  '#a1c4fd', // Azul cielo
  '#c2e9fb', // Azul muy claro
  '#ffecd2', // Crema
  '#fcb69f', // Salmón
  '#ff8a80', // Rojo claro
  '#b388ff', // Púrpura
  '#82b1ff', // Azul índigo
  '#80cbc4', // Verde azulado
];

export const getSalonColor = (salonId) => {
  // Usar el ID del Salón para seleccionar un color de la paleta
  // Esto asegura que todos los DJs del mismo salón tengan el mismo color
  const index = (salonId - 1) % colorPalette.length;
  return colorPalette[index];
};

// Mantener compatibilidad con código existente
export const getDJColor = (djId) => {
  // Esta función ahora está deprecada, usar getSalonColor en su lugar
  // Pero la mantenemos para compatibilidad temporal
  const index = (djId - 1) % colorPalette.length;
  return colorPalette[index];
};

export const getSalonColorRGB = (salonId) => {
  const hex = getSalonColor(salonId);
  // Convertir hex a RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

