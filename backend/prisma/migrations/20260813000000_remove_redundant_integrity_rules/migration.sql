-- Conserva las reglas equivalentes creadas por la migración inicial y elimina
-- únicamente los duplicados añadidos posteriormente por domain_integrity.
ALTER TABLE producto_componentes
  DROP CONSTRAINT IF EXISTS "ProductoComponente_cantidad_check";

DROP INDEX IF EXISTS "Turno_unico_abierto_key";
