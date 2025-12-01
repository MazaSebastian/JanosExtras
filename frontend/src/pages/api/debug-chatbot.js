/**
 * Endpoint de debug para el chatbot
 * Muestra información sobre la configuración de OpenAI
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const apiKeyPresent = !!apiKey;
  const apiKeyLength = apiKey ? apiKey.length : 0;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 15) + '...' : 'NO_KEY';
  
  // Intentar inicializar OpenAI
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
      name: error.name,
      code: error.code
    };
  }

  // Obtener todas las variables de entorno relacionadas
  const envKeys = Object.keys(process.env).filter(key => 
    key.includes('OPENAI') || key.includes('OPEN_AI')
  );

  return res.status(200).json({
    openai_configured: apiKeyPresent,
    api_key_length: apiKeyLength,
    api_key_prefix: apiKeyPrefix,
    api_key_valid_format: apiKey ? apiKey.startsWith('sk-') && apiKey.length > 50 : false,
    openai_client_created: !!openaiClient,
    openai_error: openaiError,
    env_keys_found: envKeys,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    message: apiKeyPresent 
      ? `✅ API Key configurada (${apiKeyLength} caracteres)`
      : '❌ API Key NO configurada',
    timestamp: new Date().toISOString()
  });
}

