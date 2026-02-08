-- Migration to add database type support
-- This adds the 'type' column to track what kind of database (PostgreSQL, MySQL, MongoDB, Redis, etc.)

ALTER TABLE databases
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'POSTGRESQL';

-- Create index for faster type-based queries
CREATE INDEX idx_databases_type ON databases(type);

-- Update existing records to explicitly set type
UPDATE databases SET type = 'POSTGRESQL' WHERE type IS NULL OR type = '';

COMMENT ON COLUMN databases.type IS 'Database type: POSTGRESQL, MYSQL, MONGODB, REDIS, MARIADB';
