-- Agregar columna de rol
ALTER TABLE djs 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'dj';

-- Agregar columna para color personalizado
ALTER TABLE djs 
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7);

-- Asegurar valores por defecto
UPDATE djs SET rol = 'dj' WHERE rol IS NULL;

