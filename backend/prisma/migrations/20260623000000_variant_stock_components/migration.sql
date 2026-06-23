ALTER TABLE "producto_componentes" ADD COLUMN "variante_id" INTEGER;
ALTER TABLE "DetallePedido" ADD COLUMN "varianteId" INTEGER;

DROP INDEX "producto_componentes_producto_id_componente_id_key";
CREATE UNIQUE INDEX "producto_componentes_producto_id_componente_id_variante_id_key"
  ON "producto_componentes"("producto_id", "componente_id", "variante_id");
CREATE INDEX "producto_componentes_variante_id_idx" ON "producto_componentes"("variante_id");
CREATE INDEX "DetallePedido_varianteId_idx" ON "DetallePedido"("varianteId");

ALTER TABLE "producto_componentes"
  ADD CONSTRAINT "producto_componentes_variante_id_fkey"
  FOREIGN KEY ("variante_id") REFERENCES "Variante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DetallePedido"
  ADD CONSTRAINT "DetallePedido_varianteId_fkey"
  FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Variante" ("productoId", "nombre", "descripcion", "orden", "disponible", "createdAt", "updatedAt")
SELECT "id", 'Italianos', 'Descuenta completos italianos', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Producto" WHERE "nombre" = '2x1 Completo Italiano o Alemán'
ON CONFLICT ("productoId", "nombre") DO UPDATE SET "disponible" = true, "orden" = 1;

INSERT INTO "Variante" ("productoId", "nombre", "descripcion", "orden", "disponible", "createdAt", "updatedAt")
SELECT "id", 'Alemanes', 'Descuenta completos alemanes', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Producto" WHERE "nombre" = '2x1 Completo Italiano o Alemán'
ON CONFLICT ("productoId", "nombre") DO UPDATE SET "disponible" = true, "orden" = 2;

DELETE FROM "producto_componentes"
WHERE "producto_id" = (SELECT "id" FROM "Producto" WHERE "nombre" = '2x1 Completo Italiano o Alemán');

INSERT INTO "producto_componentes" ("producto_id", "componente_id", "cantidad", "variante_id")
SELECT promo."id", componente."id", 2, variante."id"
FROM "Producto" promo
JOIN "Variante" variante ON variante."productoId" = promo."id" AND variante."nombre" = 'Italianos'
JOIN "Producto" componente ON componente."nombre" = 'Completo Italiano'
WHERE promo."nombre" = '2x1 Completo Italiano o Alemán';

INSERT INTO "producto_componentes" ("producto_id", "componente_id", "cantidad", "variante_id")
SELECT promo."id", componente."id", 2, variante."id"
FROM "Producto" promo
JOIN "Variante" variante ON variante."productoId" = promo."id" AND variante."nombre" = 'Alemanes'
JOIN "Producto" componente ON componente."nombre" = 'Completo Alemán'
WHERE promo."nombre" = '2x1 Completo Italiano o Alemán';

UPDATE "Producto" SET "tipo" = 'promo', "controla_stock" = false
WHERE "nombre" = '4 Completos Alemanes';
DELETE FROM "Inventario"
WHERE "productoId" = (SELECT "id" FROM "Producto" WHERE "nombre" = '4 Completos Alemanes');
INSERT INTO "producto_componentes" ("producto_id", "componente_id", "cantidad", "variante_id")
SELECT promo."id", componente."id", 4, NULL
FROM "Producto" promo
JOIN "Producto" componente ON componente."nombre" = 'Completo Alemán'
WHERE promo."nombre" = '4 Completos Alemanes'
  AND NOT EXISTS (
    SELECT 1 FROM "producto_componentes" pc
    WHERE pc."producto_id" = promo."id" AND pc."componente_id" = componente."id" AND pc."variante_id" IS NULL
  );
