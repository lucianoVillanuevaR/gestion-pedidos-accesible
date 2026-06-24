/// <reference types="node" />
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_STOCK_ACTUAL = 50;
const DEFAULT_STOCK_MINIMO = 10;
const DEFAULT_DEMO_PASSWORD = "123456";

type CategoryKey = "destacados" | "ahorros_exclusivos" | "promociones" | "completos" | "sandwich";

type VariantSeed = {
  nombre: string;
  descripcion?: string;
  orden?: number;
};

type CategoryProductSeed = {
  nombre: string;
  descripcion?: string;
  precio: number;
  precioOriginal?: number;
  descuentoPorcentaje?: number;
  variantes?: VariantSeed[];
};

type ProductSeed = CategoryProductSeed & {
  categorias: CategoryKey[];
  destacado: boolean;
  promocion: boolean;
  variantes?: VariantSeed[];
};

type CategoryDefinition = {
  key: CategoryKey;
  nombre: string;
  descripcion: string;
  orden: number;
  productos: CategoryProductSeed[];
};

type SeedTransaction = Prisma.TransactionClient;

const menuCatalog: CategoryDefinition[] = [
  {
    key: "destacados",
    nombre: "Destacados",
    descripcion: "Selección destacada y visible en la cabecera del menú.",
    orden: 1,
    productos: [
      {
        nombre: "2x1 Sandwich Italiano Carne a Elección",
        precio: 7820,
        precioOriginal: 11913,
        descuentoPorcentaje: 34
      },
      {
        nombre: "2x1 Completo Italiano o Alemán",
        precio: 3900,
        precioOriginal: 5571,
        descuentoPorcentaje: 30,
        variantes: buildVariants(["Italianos", "Alemanes"])
      },
      {
        nombre: "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección",
        precio: 8300,
        precioOriginal: 13811,
        descuentoPorcentaje: 43
      },
      {
        nombre: "ARMA TU SANDWICH",
        precio: 5500,
        precioOriginal: 7571,
        descuentoPorcentaje: 27,
        variantes: buildVariants(["churrasco", "pollo", "lomito", "mechada"])
      },
      {
        nombre: "Completo Hass Italiano",
        precio: 3500,
        precioOriginal: 4857,
        descuentoPorcentaje: 28,
        variantes: buildVariants(["vienesa", "churrasco"])
      }
    ]
  },
  {
    key: "ahorros_exclusivos",
    nombre: "Ahorros exclusivos",
    descripcion: "Productos con ahorro exclusivo publicados en la tienda.",
    orden: 2,
    productos: [
      {
        nombre: "ARMA TU SANDWICH",
        precio: 5500,
        precioOriginal: 7571,
        descuentoPorcentaje: 27,
        descripcion: "ELIGE LA CARNE DE TU SANDWICH Y 2 INGREDIENTES A ELECCIÓN",
        variantes: buildVariants(["churrasco", "pollo", "lomito", "mechada"])
      },
      {
        nombre: "SANDWICH LUCO PATRÓN",
        precio: 4900,
        precioOriginal: 7000,
        descuentoPorcentaje: 30,
        descripcion: "SANDWICH DE CARNE A ELECCIÓN QUESO, CHOCLO, TOMATE, MAYONESA",
        variantes: buildVariants(["churrasco", "pollo", "lomito"])
      },
      {
        nombre: "2x1 Completo Italiano o Alemán",
        precio: 3900,
        precioOriginal: 5571,
        descuentoPorcentaje: 30,
        descripcion: "2 completos italianos, palta, tomate, mayonesa casera"
      },
      {
        nombre: "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección",
        precio: 8300,
        precioOriginal: 13811,
        descuentoPorcentaje: 43,
        descripcion: "2 sandwich iguales, carne y 2 ingredientes a elección"
      },
      {
        nombre: "CHACARERO SANDWICH",
        precio: 5000,
        precioOriginal: 6571,
        descuentoPorcentaje: 23,
        descripcion: "SANDWICH DE CHURRASCO O PALTA, TOMATE, MAYONESA Y POROTOS VERDES"
      },
      {
        nombre: "2x1 Sandwich Italiano Carne a Elección",
        precio: 7820,
        precioOriginal: 11913,
        descuentoPorcentaje: 34,
        descripcion: "2x1 sandwich italiana, palta, tomate, mayonesa casera"
      }
    ]
  },
  {
    key: "promociones",
    nombre: "Promociones",
    descripcion: "Promociones activas del menú.",
    orden: 3,
    productos: [
      {
        nombre: "2x1 Completo Italiano o Alemán",
        precio: 3900,
        precioOriginal: 5571,
        descuentoPorcentaje: 30
      },
      {
        nombre: "2x1 Sandwich Italiano Carne a Elección",
        precio: 7820,
        precioOriginal: 11913,
        descuentoPorcentaje: 34
      },
      {
        nombre: "2x1 Sandwich Inglesa, Carne y 2 ingredientes a Elección",
        precio: 8300,
        precioOriginal: 13811,
        descuentoPorcentaje: 43
      },
      {
        nombre: "4 Completos Alemanes",
        precio: 10500,
        precioOriginal: 13333,
        descripcion: "Promoción de 4 completos alemanes"
      }
    ]
  },
  {
    key: "completos",
    nombre: "Completos",
    descripcion: "Todos los completos disponibles en el menú.",
    orden: 4,
    productos: [
      {
        nombre: "Completo Hass Italiano",
        precio: 3500,
        precioOriginal: 4857,
        descripcion: "Completo italiano con carne a elección, palta, tomate y mayonesa casera",
        variantes: buildVariants(["vienesa", "churrasco"])
      },
      {
        nombre: "Completo Italiano",
        precio: 3900,
        precioOriginal: 4571,
        descripcion: "Completo vienesa, tomate, palta, mayonesa casera"
      },
      {
        nombre: "Completo Alemán",
        precio: 2900,
        precioOriginal: 3857,
        descripcion: "Completo vienesa, chucrut, tomate, mayonesa casera"
      },
      {
        nombre: "Completo Dinámico",
        precio: 3900,
        precioOriginal: 4857,
        descripcion: "Especial vienesa, chucrut, palta, tomate, mayonesa casera"
      }
    ]
  },
  {
    key: "sandwich",
    nombre: "Sandwich",
    descripcion: "Sandwiches disponibles en el menú.",
    orden: 5,
    productos: [
      {
        nombre: "ARMA TU SANDWICH",
        precio: 5500,
        precioOriginal: 7571,
        descuentoPorcentaje: 27,
        variantes: buildVariants(["churrasco", "pollo", "lomito", "mechada"])
      },
      {
        nombre: "BARROS LUCO SANDWICH",
        precio: 5500,
        precioOriginal: 6857,
        descripcion: "SANDWICH DE CHURRASCO QUESO Y MAYONESA"
      },
      {
        nombre: "CHACARERO SANDWICH",
        precio: 5000,
        precioOriginal: 6571,
        descripcion: "SANDWICH DE CHURRASCO PALTA TOMATE MAYONESA Y POROTOS VERDES"
      },
      {
        nombre: "SANDWICH LUCO PATRÓN",
        precio: 4900,
        precioOriginal: 7000,
        descripcion: "SANDWICH DE CARNE A ELECCIÓN QUESO CHOCLO TOMATE MAYONESA",
        variantes: buildVariants(["churrasco", "pollo", "lomito"])
      }
    ]
  }
];

const products = buildProductCatalog(menuCatalog);

function buildVariants(names: string[]): VariantSeed[] {
  return names.map((nombre, index) => ({
    nombre,
    orden: index + 1
  }));
}

function buildProductCatalog(catalog: CategoryDefinition[]): ProductSeed[] {
  const mergedProducts = new Map<string, ProductSeed>();

  for (const category of catalog) {
    for (const product of category.productos) {
      const current = mergedProducts.get(product.nombre);
      const nextCategories = dedupeCategoryKeys([...(current?.categorias ?? []), category.key]);
      const nextVariants = mergeVariants(current?.variantes, product.variantes);

      const mergedProduct: ProductSeed = {
        nombre: product.nombre,
        descripcion: pickPreferredDescription(current?.descripcion, product.descripcion),
        precio: ensureMatchingNumber("precio", product.nombre, current?.precio, product.precio),
        precioOriginal: ensureOptionalMatchingNumber(
          "precioOriginal",
          product.nombre,
          current?.precioOriginal,
          product.precioOriginal
        ),
        descuentoPorcentaje: ensureOptionalMatchingNumber(
          "descuentoPorcentaje",
          product.nombre,
          current?.descuentoPorcentaje,
          product.descuentoPorcentaje
        ),
        categorias: nextCategories,
        destacado: (current?.destacado ?? false) || category.key === "destacados",
        promocion: (current?.promocion ?? false) || category.key === "promociones",
        variantes: nextVariants
      };

      mergedProducts.set(product.nombre, mergedProduct);
    }
  }

  return Array.from(mergedProducts.values()).sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));
}

function dedupeCategoryKeys(categoryKeys: CategoryKey[]): CategoryKey[] {
  return Array.from(new Set(categoryKeys));
}

function pickPreferredDescription(current?: string, incoming?: string): string | undefined {
  if (!current) {
    return incoming;
  }

  if (!incoming) {
    return current;
  }

  return incoming.length > current.length ? incoming : current;
}

function ensureMatchingNumber(
  field: string,
  productName: string,
  current: number | undefined,
  incoming: number
): number {
  if (current !== undefined && current !== incoming) {
    throw new Error(`Conflicto en ${field} para "${productName}": ${current} vs ${incoming}`);
  }

  return incoming;
}

function ensureOptionalMatchingNumber(
  field: string,
  productName: string,
  current?: number,
  incoming?: number
): number | undefined {
  if (current === undefined) {
    return incoming;
  }

  if (incoming === undefined) {
    return current;
  }

  if (current !== incoming) {
    throw new Error(`Conflicto en ${field} para "${productName}": ${current} vs ${incoming}`);
  }

  return current;
}

function mergeVariants(current?: VariantSeed[], incoming?: VariantSeed[]): VariantSeed[] | undefined {
  if (!current?.length && !incoming?.length) {
    return undefined;
  }

  const variantMap = new Map<string, VariantSeed>();

  for (const variant of current ?? []) {
    variantMap.set(variant.nombre.toLowerCase(), variant);
  }

  for (const variant of incoming ?? []) {
    const key = variant.nombre.toLowerCase();

    if (!variantMap.has(key)) {
      variantMap.set(key, variant);
    }
  }

  return Array.from(variantMap.values()).map((variant, index) => ({
    ...variant,
    orden: variant.orden ?? index + 1
  }));
}

async function seedCategories(tx: SeedTransaction) {
  const entries = await Promise.all(
    menuCatalog.map((category) =>
      tx.categoria.upsert({
        where: { nombre: category.nombre },
        update: {
          descripcion: category.descripcion,
          orden: category.orden
        },
        create: {
          nombre: category.nombre,
          descripcion: category.descripcion,
          orden: category.orden
        }
      })
    )
  );

  return new Map(
    entries.map((category) => {
      const definition = menuCatalog.find((item) => item.nombre === category.nombre);

      if (!definition) {
        throw new Error(`Categoría no encontrada en memoria: ${category.nombre}`);
      }

      return [definition.key, category.id] as const;
    })
  );
}

async function seedProducts(tx: SeedTransaction, categoryMap: Map<CategoryKey, number>) {
  const visibleProductNames = products.map((product) => product.nombre);

  await tx.producto.updateMany({
    where: {
      nombre: {
        notIn: visibleProductNames
      }
    },
    data: {
      disponible: false,
      destacado: false,
      promocion: false
    }
  });

  for (const product of products) {
    const categoryConnections = product.categorias.map((categoryKey) => {
      const categoryId = categoryMap.get(categoryKey);

      if (!categoryId) {
        throw new Error(`No se encontró el ID de la categoría ${categoryKey}`);
      }

      return { id: categoryId };
    });

    const savedProduct = await tx.producto.upsert({
      where: { nombre: product.nombre },
      update: {
        ...(product.descripcion && { descripcion: product.descripcion }),
        precio: product.precio,
        ...(product.precioOriginal && { precioOriginal: product.precioOriginal }),
        ...(product.descuentoPorcentaje && { descuentoPorcentaje: product.descuentoPorcentaje }),
        disponible: true,
        destacado: product.destacado,
        promocion: product.promocion,
        tipo: product.promocion ? "promo" : "producto",
        controlaStock: !product.promocion,
        categorias: {
          set: categoryConnections
        }
      },
      create: {
        nombre: product.nombre,
        ...(product.descripcion && { descripcion: product.descripcion }),
        precio: product.precio,
        ...(product.precioOriginal && { precioOriginal: product.precioOriginal }),
        ...(product.descuentoPorcentaje && { descuentoPorcentaje: product.descuentoPorcentaje }),
        disponible: true,
        destacado: product.destacado,
        promocion: product.promocion,
        tipo: product.promocion ? "promo" : "producto",
        controlaStock: !product.promocion,
        categorias: {
          connect: categoryConnections
        }
      }
    });

    if (!product.promocion)
      await tx.inventario.upsert({
        where: { productoId: savedProduct.id },
        update: {},
        create: {
          productoId: savedProduct.id,
          stockActual: DEFAULT_STOCK_ACTUAL,
          stockMinimo: DEFAULT_STOCK_MINIMO
        }
      });
    else await tx.inventario.deleteMany({ where: { productoId: savedProduct.id } });

    await tx.variante.deleteMany({
      where: {
        productoId: savedProduct.id
      }
    });

    if (product.variantes?.length) {
      await tx.variante.createMany({
        data: product.variantes.map((variant, index) => ({
          productoId: savedProduct.id,
          nombre: variant.nombre,
          ...(variant.descripcion && { descripcion: variant.descripcion }),
          orden: variant.orden ?? index + 1,
          disponible: true
        }))
      });
    }
  }

  const promoCompleto = await tx.producto.findUnique({
    where: { nombre: "2x1 Completo Italiano o Alemán" },
    include: { variantes: true }
  });
  const completoItaliano = await tx.producto.findUnique({ where: { nombre: "Completo Italiano" } });
  const completoAleman = await tx.producto.findUnique({ where: { nombre: "Completo Alemán" } });
  if (promoCompleto && completoItaliano && completoAleman) {
    const italianos = promoCompleto.variantes.find((item) => item.nombre === "Italianos");
    const alemanes = promoCompleto.variantes.find((item) => item.nombre === "Alemanes");
    if (italianos && alemanes) {
      await tx.productoComponente.deleteMany({ where: { productoId: promoCompleto.id } });
      await tx.productoComponente.createMany({
        data: [
          { productoId: promoCompleto.id, componenteId: completoItaliano.id, cantidad: 2, varianteId: italianos.id },
          { productoId: promoCompleto.id, componenteId: completoAleman.id, cantidad: 2, varianteId: alemanes.id }
        ]
      });
    }
  }

  const promoCuatro = await tx.producto.findUnique({ where: { nombre: "4 Completos Alemanes" } });
  if (promoCuatro && completoAleman) {
    await tx.productoComponente.deleteMany({ where: { productoId: promoCuatro.id } });
    await tx.productoComponente.create({
      data: { productoId: promoCuatro.id, componenteId: completoAleman.id, cantidad: 4 }
    });
  }

  const promocionesSinComponentes = await tx.producto.findMany({
    where: { tipo: "promo", componentes: { none: {} } },
    select: { nombre: true }
  });
  for (const promo of promocionesSinComponentes) {
    console.warn(`TODO inventario: configurar manualmente componentes para "${promo.nombre}".`);
  }
}

async function main() {
  // Los usuarios demo facilitan exclusivamente el entorno local y nunca se crean en producción.
  const shouldSeedDemoUsers = process.env.NODE_ENV !== "production";
  const demoPassword = process.env.SEED_DEMO_PASSWORD?.trim() || DEFAULT_DEMO_PASSWORD;
  const passwordHash = shouldSeedDemoUsers ? await bcrypt.hash(demoPassword, 12) : null;

  await prisma.$transaction(async (tx) => {
    if (passwordHash) {
      for (const user of [
        { username: "cajero", email: "cajero@demo.cl", role: "cajero", label: "Cajero" },
        { username: "cocina", email: "cocina@demo.cl", role: "cocina", label: "Cocina" },
        { username: "admin", email: "admin@demo.cl", role: "admin", label: "Administrador" }
      ]) {
        await tx.usuario.upsert({
          where: { username: user.username },
          update: { ...user, passwordHash, activo: true },
          create: { ...user, passwordHash }
        });
      }
    }

    const categoryMap = await seedCategories(tx);
    await seedProducts(tx, categoryMap);
    const completos = await tx.producto.findMany({
      where: { nombre: { contains: "Completo", mode: "insensitive" } },
      select: { id: true }
    });
    await tx.categoria.update({
      where: { nombre: "Completos" },
      data: { productos: { connect: completos } }
    });
    await tx.categoria.deleteMany({
      where: { nombre: { in: ["Completos / Hot Dogs", "Completos / Hot dogs"] } }
    });
  });

  console.log(`${menuCatalog.length} categorías sincronizadas exitosamente.`);
  console.log(`${products.length} productos sincronizados exitosamente.`);
  console.log(shouldSeedDemoUsers ? "Usuarios demo sincronizados para desarrollo." : "Usuarios demo omitidos.");
  console.log(
    `${products.filter((product) => product.variantes?.length).length} productos con variantes sincronizados.`
  );
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
