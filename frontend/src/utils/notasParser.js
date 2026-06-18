/**
 * Utilidad para parsear datos adicionales de clientes (Mail, DNI, Dirección)
 * que son scrapeados desde Jano's y se almacenan temporalmente en el campo "notas".
 */
export const parseNotasAdicionales = (notas) => {
  if (!notas) return { mail: null, dni: null, direccion: null, notasRestantes: null };
  
  let mail = null;
  let dni = null;
  let direccion = null;
  
  // Buscar patrones
  const mailMatch = notas.match(/(?:Mail|Email|Correo):\s*([^|]+)/i);
  const dniMatch = notas.match(/(?:DNI|Documento):\s*([^|]+)/i);
  const direccionMatch = notas.match(/(?:Dirección|Direccion):\s*([^|]+)/i);
  
  if (mailMatch) mail = mailMatch[1].trim();
  if (dniMatch) dni = dniMatch[1].trim();
  if (direccionMatch) direccion = direccionMatch[1].trim();
  
  // Extraer las notas restantes (lo que no sea Mail, DNI o Dirección)
  const parts = notas.split('|').map(p => p.trim());
  const filteredParts = parts.filter(p => {
    return !p.match(/^(Mail|Email|Correo|DNI|Documento|Dirección|Direccion):/i);
  });
  
  const notasRestantes = filteredParts.join(' | ').trim();
  
  return { mail, dni, direccion, notasRestantes: notasRestantes || null };
};
