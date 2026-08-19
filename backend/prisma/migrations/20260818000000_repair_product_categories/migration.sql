-- Corrige únicamente el caso histórico confirmado. No se infieren categorías por
-- coincidencias parciales porque nombres como "té" pueden aparecer dentro de
-- palabras no relacionadas y eliminar asociaciones válidas.
DELETE FROM "_CategoriaToProducto" AS relation_to_remove
USING "Producto" AS product, "Categoria" AS old_category, "Categoria" AS correct_category
WHERE product."nombre" = 'SANDWICH LUCO PATRÓN'
  AND old_category."nombre" = 'Ahorros exclusivos'
  AND correct_category."nombre" = 'Sandwich'
  AND relation_to_remove."B" = product."id"
  AND relation_to_remove."A" = old_category."id"
  AND EXISTS (
    SELECT 1
    FROM "_CategoriaToProducto" AS correct_relation
    WHERE correct_relation."B" = product."id"
      AND correct_relation."A" = correct_category."id"
  );
