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

  // Intentar crear cliente de OpenAI
  let openaiClient = null;
  let openaiError = null;
  
  try {
    if (apiKey) {
      const { default: OpenAI } = await import('openai');
      openaiClient = new OpenAI({
        apiKey: apiKey,
      });
    }
  } catch (error) {
    openaiError = {
      message: error.message,
      name: error.name
    };
  }

  // Obtener todas las variables de entorno relacionadas
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('OPENAI') || key.includes('OPEN_AI')
  );

  return res.status(200).json({
    openai_configured: !!apiKey,
    api_key_length: apiKeyLength,
    api_key_prefix: apiKeyPrefix,
    api_key_suffix: apiKeySuffix,
    is_valid_format: isValidFormat,
    has_spaces: apiKey ? apiKey.includes(' ') : false,
    has_newlines: apiKey ? apiKey.includes('\n') : false,
    openai_client_created: !!openaiClient,
    openai_error: openaiError,
    env_keys_found: envKeys,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    // NO exponer la key completa por seguridad
    message: apiKey 
      ? `✅ API Key configurada (${apiKeyLength} caracteres, formato: ${isValidFormat ? 'válido' : 'inválido'})`
      : '❌ API Key NO configurada'
  });
}

