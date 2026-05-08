/// <reference types="node" />
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const productosBase = [
    {
      nombre: "Hamburguesa Clásica",
      descripcion: "Hamburguesa con carne, lechuga, tomate y cebolla",
      precio: 8500,
      disponible: true
    },
    {
      nombre: "Completo Italiano",
      descripcion: "Pan tostado, carne, tomate, cebolla, palta y mayonesa",
      precio: 7500,
      disponible: true
    },
    {
      nombre: "Papas Fritas",
      descripcion: "Papas fritas crujientes con sal",
      precio: 3500,
      disponible: true
    },
    {
      nombre: "Bebida",
      descripcion: "Bebida gaseosa o jugo natural (especificar en observación)",
      precio: 2500,
      disponible: true
    },
    {
      nombre: "Chacarero",
      descripcion: "Pan, carne, porotos verdes, tomate y ajo",
      precio: 8000,
      disponible: true
    },
    {
      nombre: "Barros Luco",
      descripcion: "Pan, carne, queso derretido y cebolla caramelizada",
      precio: 9000,
      disponible: true
    },
    {
      nombre: "Arma tu Sandwich",
      descripcion: "Elige los ingredientes de tu preferencia",
      precio: 7000,
      disponible: true
    },
    {
      nombre: "Sandwich Luco Patrón",
      descripcion: "Pan, carne, queso, tomate, lechuga, palta y mayonesa",
      precio: 10000,
      disponible: true
    },
    {
      nombre: "Ave Palta",
      descripcion: "Pan, pollo a la plancha, palta y mayonesa casera",
      precio: 8200,
      disponible: true
    }
  ];

  const productos = await Promise.all(
    productosBase.map((producto) =>
      prisma.producto.upsert({
        where: { nombre: producto.nombre },
        update: {
          descripcion: producto.descripcion,
          precio: producto.precio,
          disponible: producto.disponible
        },
        create: producto
      })
    )
  );

  console.log(`${productos.length} productos sincronizados exitosamente`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
