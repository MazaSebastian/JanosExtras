/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param {number} lat1 - Latitud del primer punto
 * @param {number} lon1 - Longitud del primer punto
 * @param {number} lat2 - Latitud del segundo punto
 * @param {number} lon2 - Longitud del segundo punto
 * @returns {number} Distancia en metros
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Valida si el DJ está dentro del radio permitido del salón
 * @param {number} djLat - Latitud del DJ
 * @param {number} djLon - Longitud del DJ
 * @param {number} salonLat - Latitud del salón
 * @param {number} salonLon - Longitud del salón
 * @param {number} maxDistance - Distancia máxima en metros (por defecto 500m)
 * @returns {object} { valid: boolean, distance: number, message: string }
 */
export function validateLocation(djLat, djLon, salonLat, salonLon, maxDistance = 500) {
  if (!salonLat || !salonLon) {
    return {
      valid: false,
      distance: null,
      message: 'El salón no tiene coordenadas configuradas. Contacta al administrador.',
    };
  }

  if (!djLat || !djLon) {
    return {
      valid: false,
      distance: null,
      message: 'No se pudo obtener tu ubicación. Verifica los permisos de geolocalización.',
    };
  }

  const distance = calculateDistance(djLat, djLon, salonLat, salonLon);
  const valid = distance <= maxDistance;

  return {
    valid,
    distance: Math.round(distance),
    message: valid
      ? `Ubicación verificada. Estás a ${Math.round(distance)} metros del salón.`
      : `Estás demasiado lejos del salón. Distancia: ${Math.round(distance)} metros (máximo permitido: ${maxDistance}m).`,
  };
}

