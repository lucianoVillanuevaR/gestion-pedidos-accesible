CREATE TYPE "TipoProducto" AS ENUM ('producto', 'promo', 'combo');

ALTER TABLE "Producto"
  ADD COLUMN "tipo" "TipoProducto" NOT NULL DEFAULT 'producto',
  ADD COLUMN "controla_stock" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "producto_componentes" (
  "id" SERIAL NOT NULL,
  "producto_id" INTEGER NOT NULL,
  "componente_id" INTEGER NOT NULL,
  "cantidad" INTEGER NOT NULL,
  CONSTRAINT "producto_componentes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "producto_componentes_cantidad_check" CHECK ("cantidad" > 0)
);

CREATE UNIQUE INDEX "producto_componentes_producto_id_componente_id_key"
  ON "producto_componentes"("producto_id", "componente_id");
CREATE INDEX "producto_componentes_producto_id_idx" ON "producto_componentes"("producto_id");
CREATE INDEX "producto_componentes_componente_id_idx" ON "producto_componentes"("componente_id");

ALTER TABLE "producto_componentes"
  ADD CONSTRAINT "producto_componentes_producto_id_fkey"
  FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "producto_componentes_componente_id_fkey"
  FOREIGN KEY ("componente_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Producto"
SET "tipo" = 'promo', "controla_stock" = false
WHERE "nombre" ~* '^\s*2x1([[:space:]]|$)';

-- Asociación segura cuando el nombre después de "2x1" coincide exactamente con un producto real.
INSERT INTO "producto_componentes" ("producto_id", "componente_id", "cantidad")
SELECT promo."id", componente."id", 2
FROM "Producto" promo
JOIN "Producto" componente
  ON lower(trim(componente."nombre")) = lower(trim(regexp_replace(promo."nombre", '^\s*2x1\s*', '', 'i')))
WHERE promo."tipo" = 'promo' AND componente."id" <> promo."id"
ON CONFLICT ("producto_id", "componente_id") DO NOTHING;

DELETE FROM "Inventario"
WHERE "productoId" IN (SELECT "id" FROM "Producto" WHERE "controla_stock" = false);

DO $$
DECLARE promo_sin_componente RECORD;
BEGIN
  FOR promo_sin_componente IN
    SELECT p."id", p."nombre"
    FROM "Producto" p
    WHERE p."tipo" = 'promo'
      AND NOT EXISTS (SELECT 1 FROM "producto_componentes" pc WHERE pc."producto_id" = p."id")
  LOOP
    RAISE NOTICE 'TODO inventario: configurar manualmente componentes para promoción id=% nombre=%',
      promo_sin_componente."id", promo_sin_componente."nombre";
  END LOOP;
END $$;
