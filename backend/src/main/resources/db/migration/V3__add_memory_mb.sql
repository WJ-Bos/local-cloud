-- Add memory limit column to databases table
-- NULL means no memory limit (Docker default behaviour: unconstrained)
ALTER TABLE databases ADD COLUMN memory_mb INTEGER;