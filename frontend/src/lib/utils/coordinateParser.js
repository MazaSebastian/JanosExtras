/**
 * Utilidad para parsear coordenadas en diferentes formatos
 * Soporta formatos de Google Maps y otros formatos comunes
 */

/**
 * Convierte grados, minutos y segundos a decimal
 * @param {number} degrees - Grados
 * @param {number} minutes - Minutos
 * @param {number} seconds - Segundos
 * @param {string} direction - Dirección (N, S, E, W)
 * @returns {number} Coordenada decimal
 */
function dmsToDecimal(degrees, minutes, seconds, direction) {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

/**
 * Parsea coordenadas en formato DMS (Degrees, Minutes, Seconds)
 * Ejemplo: "34°35'19.2"S 58°26'14.9"W"
 * @param {string} input - String con coordenadas
 * @returns {Object|null} { lat, lng } o null si no se puede parsear
 */
function parseDMS(input) {
  // Patrón para formato: 34°35'19.2"S 58°26'14.9"W
  // También acepta: 34°35'19.2"S, 58°26'14.9"W (con coma)
  // Y variaciones con espacios
  const dmsPattern = /(\d+)°\s*(\d+)['′]\s*([\d.]+)["″]?\s*([NS])\s*[,]?\s*(\d+)°\s*(\d+)['′]\s*([\d.]+)["″]?\s*([EW])/i;
  
  const match = input.match(dmsPattern);
  if (!match) return null;

  const latDegrees = parseFloat(match[1]);
  const latMinutes = parseFloat(match[2]);
  const latSeconds = parseFloat(match[3]);
  const latDirection = match[4].toUpperCase();

  const lngDegrees = parseFloat(match[5]);
  const lngMinutes = parseFloat(match[6]);
  const lngSeconds = parseFloat(match[7]);
  const lngDirection = match[8].toUpperCase();

  return {
    lat: dmsToDecimal(latDegrees, latMinutes, latSeconds, latDirection),
    lng: dmsToDecimal(lngDegrees, lngMinutes, lngSeconds, lngDirection),
  };
}

/**
 * Parsea coordenadas en formato decimal
 * Ejemplos: "-34.588667, -58.437472" o "-34.588667,-58.437472"
 * @param {string} input - String con coordenadas
 * @returns {Object|null} { lat, lng } o null si no se puede parsear
 */
function parseDecimal(input) {
  // Remover espacios y dividir por coma
  const cleaned = input.trim().replace(/\s+/g, ' ');
  const parts = cleaned.split(/[,\s]+/);

  if (parts.length < 2) return null;

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/**
 * Parsea coordenadas en formato Google Maps URL
 * Ejemplo: "34.588667,-58.437472" o "?q=-34.588667,-58.437472"
 * @param {string} input - String con coordenadas
 * @returns {Object|null} { lat, lng } o null si no se puede parsear
 */
function parseURL(input) {
  // Buscar patrones como ?q=-34.588667,-58.437472
  const urlPattern = /[?&]q=([+-]?\d+\.?\d*),([+-]?\d+\.?\d*)/;
  const match = input.match(urlPattern);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  
  return null;
}

/**
 * Parsea coordenadas en cualquier formato soportado
 * @param {string} input - String con coordenadas
 * @returns {Object|null} { lat, lng } o null si no se puede parsear
 */
export function parseCoordinates(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // Intentar parsear en diferentes formatos
  let result = parseDMS(trimmed);
  if (result) return result;

  result = parseURL(trimmed);
  if (result) return result;

  result = parseDecimal(trimmed);
  if (result) return result;

  return null;
}

/**
 * Valida si un string parece contener coordenadas
 * @param {string} input - String a validar
 * @returns {boolean} true si parece contener coordenadas
 */
export function looksLikeCoordinates(input) {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  
  // Buscar patrones comunes
  return (
    /°/.test(trimmed) || // Formato DMS
    /[+-]?\d+\.?\d*,\s*[+-]?\d+\.?\d*/.test(trimmed) || // Formato decimal
    /[?&]q=/.test(trimmed) // URL de Google Maps
  );
}
