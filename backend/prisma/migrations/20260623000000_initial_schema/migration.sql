-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('producto', 'promo', 'combo');

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "precio_original" DECIMAL(10,2),
    "descuento_porcentaje" INTEGER,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "promocion" BOOLEAN NOT NULL DEFAULT false,
    "tipo" "TipoProducto" NOT NULL DEFAULT 'producto',
    "controla_stock" BOOLEAN NOT NULL DEFAULT true,
    "imagen_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "producto_componentes" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "componente_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "variante_id" INTEGER,
    CONSTRAINT "producto_componentes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "producto_componentes_cantidad_check" CHECK ("cantidad" > 0)
);

CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Variante" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "stock_actual" INTEGER NOT NULL,
    "stock_minimo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "metodoPago" TEXT NOT NULL,
    "clienteNombre" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "turnoId" INTEGER,
    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DetallePedido" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "varianteId" INTEGER,
    "personalizacion" JSONB,
    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Turno" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "resumen" JSONB,
    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_CategoriaToProducto" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Producto_nombre_key" ON "Producto"("nombre");
CREATE INDEX "producto_componentes_producto_id_idx" ON "producto_componentes"("producto_id");
CREATE INDEX "producto_componentes_componente_id_idx" ON "producto_componentes"("componente_id");
CREATE INDEX "producto_componentes_variante_id_idx" ON "producto_componentes"("variante_id");
CREATE UNIQUE INDEX "producto_componentes_producto_id_componente_id_variante_id_key"
    ON "producto_componentes"("producto_id", "componente_id", "variante_id");
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");
CREATE INDEX "Variante_productoId_idx" ON "Variante"("productoId");
CREATE UNIQUE INDEX "Variante_productoId_nombre_key" ON "Variante"("productoId", "nombre");
CREATE UNIQUE INDEX "Inventario_productoId_key" ON "Inventario"("productoId");
CREATE INDEX "Pedido_turnoId_idx" ON "Pedido"("turnoId");
CREATE INDEX "DetallePedido_pedidoId_idx" ON "DetallePedido"("pedidoId");
CREATE INDEX "DetallePedido_productoId_idx" ON "DetallePedido"("productoId");
CREATE INDEX "DetallePedido_varianteId_idx" ON "DetallePedido"("varianteId");
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE INDEX "Turno_estado_idx" ON "Turno"("estado");
CREATE INDEX "Turno_usuarioId_idx" ON "Turno"("usuarioId");
CREATE UNIQUE INDEX "Turno_unico_abierto" ON "Turno"("estado") WHERE "estado" = 'abierto';
CREATE UNIQUE INDEX "_CategoriaToProducto_AB_unique" ON "_CategoriaToProducto"("A", "B");
CREATE INDEX "_CategoriaToProducto_B_index" ON "_CategoriaToProducto"("B");

-- AddForeignKey
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_producto_id_fkey"
    FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_componente_id_fkey"
    FOREIGN KEY ("componente_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_variante_id_fkey"
    FOREIGN KEY ("variante_id") REFERENCES "Variante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_turnoId_fkey"
    FOREIGN KEY ("turnoId") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_pedidoId_fkey"
    FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_productoId_fkey"
    FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_varianteId_fkey"
    FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "_CategoriaToProducto" ADD CONSTRAINT "_CategoriaToProducto_A_fkey"
    FOREIGN KEY ("A") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CategoriaToProducto" ADD CONSTRAINT "_CategoriaToProducto_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
