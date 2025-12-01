/**
 * Endpoint de prueba para verificar configuración de OpenAI
 * SOLO PARA DEBUGGING - Eliminar después de verificar
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const apiKeyLength = apiKey ? apiKey.length : 0;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) : 'NO_KEY';
  const apiKeySuffix = apiKey ? apiKey.substring(apiKey.length - 10) : 'NO_KEY';
  
  // Verificar si la key tiene el formato correcto
  const isValidFormat = apiKey && apiKey.startsWith('sk-') && apiKey.length > 50;

  return res.status(200).json({
    openai_configured: !!apiKey,
    api_key_length: apiKeyLength,
    api_key_prefix: apiKeyPrefix,
    api_key_suffix: apiKeySuffix,
    is_valid_format: isValidFormat,
    has_spaces: apiKey ? apiKey.includes(' ') : false,
    has_newlines: apiKey ? apiKey.includes('\n') : false,
    // NO exponer la key completa por seguridad
    message: apiKey 
      ? `✅ API Key configurada (${apiKeyLength} caracteres, formato: ${isValidFormat ? 'válido' : 'inválido'})`
      : '❌ API Key NO configurada'
  });
}

