import { withProductImageUrl } from "./productImageService";

export const PRODUCTO_CATALOG_INCLUDE = {
  categorias: { orderBy: { nombre: "asc" } },
  inventario: true,
  componentes: {
    include: { componente: { include: { inventario: true } } },
    orderBy: { id: "asc" }
  },
  variantes: { where: { disponible: true }, orderBy: { orden: "asc" } }
} as const;

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
    categorias?: Array<{ nombre: string }>;
    imagenUrl?: string | null;
  }
>(producto: T) {
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
    disponibleConfigurado: producto.disponible,
    disponible: producto.disponible && (stockDisponible === null || stockDisponible > 0),
    requiereSeleccionVariante: varianteIds.length > 0,
    stockDisponible
  });
}
