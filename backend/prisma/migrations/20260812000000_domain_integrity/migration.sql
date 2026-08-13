-- Refuerza dominios que ya valida la aplicación sin transformar columnas ni datos existentes.
ALTER TABLE "Usuario"
  ADD CONSTRAINT "Usuario_role_check" CHECK ("role" IN ('cajero', 'cocina', 'admin'));

ALTER TABLE "Pedido"
  ADD CONSTRAINT "Pedido_estado_check" CHECK ("estado" IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  ADD CONSTRAINT "Pedido_metodo_pago_check" CHECK ("metodoPago" IN ('efectivo', 'tarjeta', 'transferencia')),
  ADD CONSTRAINT "Pedido_total_check" CHECK ("total" >= 0);

ALTER TABLE "Turno"
  ADD CONSTRAINT "Turno_estado_check" CHECK ("estado" IN ('abierto', 'cerrado'));

ALTER TABLE "Inventario"
  ADD CONSTRAINT "Inventario_stock_actual_check" CHECK (stock_actual >= 0),
  ADD CONSTRAINT "Inventario_stock_minimo_check" CHECK (stock_minimo >= 0);

ALTER TABLE "Producto"
  ADD CONSTRAINT "Producto_precio_check" CHECK ("precio" >= 0);

ALTER TABLE producto_componentes
  ADD CONSTRAINT "ProductoComponente_cantidad_check" CHECK ("cantidad" > 0);

CREATE UNIQUE INDEX "Turno_unico_abierto_key" ON "Turno" ("estado") WHERE "estado" = 'abierto';
CREATE INDEX "Pedido_turnoId_createdAt_idx" ON "Pedido" ("turnoId", "createdAt");
CREATE INDEX "Turno_estado_fechaCierre_idx" ON "Turno" ("estado", "fechaCierre");
