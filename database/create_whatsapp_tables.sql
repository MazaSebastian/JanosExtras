-- Tablas para WhatsApp Business API con Twilio

-- Tabla de conversaciones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversaciones (
  id SERIAL PRIMARY KEY,
  coordinacion_id INTEGER REFERENCES coordinaciones(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL, -- Número de teléfono (formato: +5491123456789)
  contact_name VARCHAR(255), -- Nombre del contacto (si está disponible)
  last_message_at TIMESTAMP,
  last_message_preview TEXT, -- Vista previa del último mensaje
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coordinacion_id, phone_number)
);

-- Tabla de mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_mensajes (
  id SERIAL PRIMARY KEY,
  conversacion_id INTEGER REFERENCES whatsapp_conversaciones(id) ON DELETE CASCADE,
  coordinacion_id INTEGER REFERENCES coordinaciones(id) ON DELETE CASCADE,
  twilio_message_sid VARCHAR(100), -- SID del mensaje de Twilio
  from_number VARCHAR(20) NOT NULL, -- Número que envía
  to_number VARCHAR(20) NOT NULL, -- Número que recibe
  body TEXT NOT NULL, -- Contenido del mensaje
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')), -- inbound = recibido, outbound = enviado
  status VARCHAR(20) DEFAULT 'sent', -- sent, delivered, read, failed
  media_url TEXT, -- URL de medios (imágenes, videos, etc.)
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_coordinacion ON whatsapp_conversaciones(coordinacion_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_phone ON whatsapp_conversaciones(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversaciones_unread ON whatsapp_conversaciones(unread_count) WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_whatsapp_mensajes_conversacion ON whatsapp_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensajes_coordinacion ON whatsapp_mensajes(coordinacion_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensajes_phone ON whatsapp_mensajes(from_number, to_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensajes_sent_at ON whatsapp_mensajes(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensajes_status ON whatsapp_mensajes(status);

-- Comentarios
COMMENT ON TABLE whatsapp_conversaciones IS 'Conversaciones de WhatsApp agrupadas por coordinación y número de teléfono';
COMMENT ON TABLE whatsapp_mensajes IS 'Mensajes individuales de WhatsApp';
COMMENT ON COLUMN whatsapp_conversaciones.phone_number IS 'Número de teléfono en formato internacional (ej: +5491123456789)';
COMMENT ON COLUMN whatsapp_mensajes.direction IS 'Dirección del mensaje: inbound (recibido) o outbound (enviado)';
COMMENT ON COLUMN whatsapp_mensajes.status IS 'Estado del mensaje: sent, delivered, read, failed';

