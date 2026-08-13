import prisma from "../config/prisma";

async function main() {
  const products = await prisma.producto.findMany({
    where: { controlaStock: true, tipo: "producto", inventario: null },
    select: { id: true, nombre: true }
  });

  if (products.length === 0) {
    console.log("No hay registros de inventario pendientes de reparar.");
    return;
  }

  await prisma.inventario.createMany({
    data: products.map(({ id }) => ({
      productoId: id,
      stockActual: 0,
      stockMinimo: 0
    })),
    skipDuplicates: true
  });
  console.log(`Se crearon ${products.length} registros de inventario faltantes.`);
}

main()
  .catch((error) => {
    console.error("No se pudo reparar el inventario:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
