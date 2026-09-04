ALTER TABLE "Pedido"
ADD COLUMN "idempotency_key" VARCHAR(36);

CREATE UNIQUE INDEX "Pedido_idempotency_key_key"
ON "Pedido"("idempotency_key");
