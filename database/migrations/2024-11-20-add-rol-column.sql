-- Agregar columna de rol a la tabla de DJs
ALTER TABLE djs 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'dj';

-- Opcional: actualizar DJs existentes sin rol (por si la columna quedó null)
UPDATE djs SET rol = 'dj' WHERE rol IS NULL;

