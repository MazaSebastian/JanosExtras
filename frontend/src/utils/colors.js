// Generar un color único y consistente basado en el ID del DJ
// Usa una paleta de colores predefinida para asegurar buena visibilidad

const colorPalette = [
  '#667eea', // Azul púrpura
  '#f093fb', // Rosa
  '#4facfe', // Azul claro
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

export const getDJColor = (djId) => {
  // Usar el ID del DJ para seleccionar un color de la paleta
  // Esto asegura que el mismo DJ siempre tenga el mismo color
  const index = (djId - 1) % colorPalette.length;
  return colorPalette[index];
};

export const getDJColorRGB = (djId) => {
  const hex = getDJColor(djId);
  // Convertir hex a RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

