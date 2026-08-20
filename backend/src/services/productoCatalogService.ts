import { Prisma } from "@prisma/client";
import { withProductImageUrl } from "./productImageUrl";

export const PRODUCTO_CATALOG_INCLUDE = {
  categorias: { orderBy: [{ orden: "asc" }, { nombre: "asc" }] },
  inventario: true,
  componentes: {
    include: { componente: { include: { inventario: true } } },
    orderBy: { id: "asc" }
  },
  variantes: { where: { disponible: true }, orderBy: { orden: "asc" } }
} satisfies Prisma.ProductoInclude;

export async function buildCategoriaReplacement(
  categoriaRepository: {
    upsert(args: {
      create: { descripcion: string; nombre: string };
      update: Record<string, never>;
      where: { nombre: string };
    }): Promise<{ id: number }>;
  },
  categoria: string
) {
  const categoriaSeleccionada = await categoriaRepository.upsert({
    create: { descripcion: `Productos de ${categoria}`, nombre: categoria },
    update: {},
    where: { nombre: categoria }
  });

  return { set: [{ id: categoriaSeleccionada.id }] };
}

export function toProductoResponse<
  T extends {
    disponible: boolean;
    controlaStock: boolean;
    tipo?: "producto" | "promo" | "combo";
    inventario?: { stockActual: number } | null;
    componentes?: Array<{
      cantidad: number;
      varianteId?: number | null;
      componente: { inventario?: { stockActual: number } | null };
    }>;
    categorias?: Array<{ nombre: string; orden?: number }>;
    imagenUrl?: string | null;
  }
>(producto: T) {
  const categoriaPrincipal =
    producto.categorias?.find((categoria) => !["Destacados", "Promociones"].includes(categoria.nombre)) ??
    producto.categorias?.find((categoria) => categoria.nombre !== "Destacados") ??
    producto.categorias?.[0];
  const componentes = producto.componentes ?? [];
  const varianteIds = [...new Set(componentes.flatMap((item) => (item.varianteId ? [item.varianteId] : [])))];
  const getStockDisponible = (items: typeof componentes) =>
    Math.min(...items.map((item) => Math.floor((item.componente.inventario?.stockActual ?? 0) / item.cantidad)));
  const esPromoCombinableSinVariantes =
    producto.tipo === "promo" && componentes.length === 2 && varianteIds.length === 0;
  const esPromoCombinableConVariantes =
    producto.tipo === "promo" &&
    componentes.length === 2 &&
    varianteIds.length === 2 &&
    componentes[0].cantidad === componentes[1].cantidad;
  const esPromoCombinable = esPromoCombinableSinVariantes || esPromoCombinableConVariantes;
  const stockDisponible = componentes.length
    ? esPromoCombinable
      ? Math.floor(
          componentes.reduce((total, item) => total + (item.componente.inventario?.stockActual ?? 0), 0) /
            (esPromoCombinableConVariantes
              ? componentes[0].cantidad
              : componentes.reduce((total, item) => total + item.cantidad, 0))
        )
      : varianteIds.length
        ? Math.max(
            ...varianteIds.map((varianteId) =>
              getStockDisponible(componentes.filter((item) => !item.varianteId || item.varianteId === varianteId))
            )
          )
        : getStockDisponible(componentes)
    : producto.controlaStock
      ? (producto.inventario?.stockActual ?? 0)
      : null;

  return withProductImageUrl({
    ...producto,
    categoria: categoriaPrincipal?.nombre,
    disponibleConfigurado: producto.disponible,
    disponible: producto.disponible && (stockDisponible === null || stockDisponible > 0),
    requiereSeleccionVariante: varianteIds.length > 0,
    stockDisponible
  });
}
