CREATE TABLE "pedido_historial" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "accion" TEXT NOT NULL,
    "cambios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_historial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pedido_historial_pedido_id_createdAt_idx" ON "pedido_historial"("pedido_id", "createdAt");
CREATE INDEX "pedido_historial_usuario_id_idx" ON "pedido_historial"("usuario_id");

ALTER TABLE "pedido_historial"
ADD CONSTRAINT "pedido_historial_pedido_id_fkey"
FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pedido_historial"
ADD CONSTRAINT "pedido_historial_usuario_id_fkey"
FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
