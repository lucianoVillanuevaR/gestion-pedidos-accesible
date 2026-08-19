-- Repara asociaciones múltiples creadas por el antiguo flujo de edición.
-- Solo actúa cuando la categoría correcta puede inferirse por el nombre y ya está asociada;
-- los casos ambiguos se conservan para evitar pérdida de información.
WITH inferred_categories AS (
  SELECT
    p."id" AS "productoId",
    CASE
      WHEN lower(p."nombre") LIKE '%completo%' THEN 'Completos'
      WHEN lower(p."nombre") LIKE '%hamburguesa%'
        OR lower(p."nombre") LIKE '%sandwich%'
        OR lower(p."nombre") LIKE '%chacarero%'
        OR lower(p."nombre") LIKE '%luco%' THEN 'Sandwich'
      WHEN lower(p."nombre") LIKE '%bebida%'
        OR lower(p."nombre") LIKE '%jugo%'
        OR lower(p."nombre") LIKE '%agua%'
        OR lower(p."nombre") LIKE '%te%' THEN 'Bebidas'
      ELSE NULL
    END AS "categoriaNombre"
  FROM "Producto" p
), repairable_products AS (
  SELECT inferred."productoId", keep_category."id" AS "categoriaId"
  FROM inferred_categories inferred
  JOIN "Categoria" keep_category ON keep_category."nombre" = inferred."categoriaNombre"
  JOIN "_CategoriaToProducto" keep_relation
    ON keep_relation."A" = keep_category."id"
    AND keep_relation."B" = inferred."productoId"
  WHERE inferred."categoriaNombre" IS NOT NULL
    AND (
      SELECT count(*)
      FROM "_CategoriaToProducto" relation_count
      WHERE relation_count."B" = inferred."productoId"
    ) > 1
)
DELETE FROM "_CategoriaToProducto" relation_to_remove
USING repairable_products repair
WHERE relation_to_remove."B" = repair."productoId"
  AND relation_to_remove."A" <> repair."categoriaId";
