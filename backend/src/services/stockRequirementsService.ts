export type StockRequirement = {
  cantidad: number;
  componenteNombre: string;
  productosVendidos: Set<string>;
};

export type StockProduct = {
  id: number;
  nombre: string;
  tipo: "producto" | "promo" | "combo";
  controlaStock: boolean;
  componentes: Array<{
    componenteId: number;
    cantidad: number;
    varianteId?: number | null;
    componente: { nombre: string };
  }>;
};

export function getApplicableStockComponents(
  producto: StockProduct,
  varianteId?: number,
  combinacion?: { componentes: Array<{ componenteId: number; cantidad: number }> }
) {
  const requiereVariante = producto.componentes.some((item) => item.varianteId != null);
  const [primerComponente, segundoComponente] = producto.componentes;
  const esPromoCombinableSinVariantes =
    producto.tipo === "promo" &&
    producto.componentes.length === 2 &&
    producto.componentes.every((item) => item.varianteId == null && item.cantidad > 0);
  const esPromoCombinableConVariantes =
    producto.tipo === "promo" &&
    producto.componentes.length === 2 &&
    primerComponente.varianteId != null &&
    segundoComponente.varianteId != null &&
    primerComponente.varianteId !== segundoComponente.varianteId &&
    primerComponente.cantidad === segundoComponente.cantidad;
  const esPromoCombinable = esPromoCombinableSinVariantes || esPromoCombinableConVariantes;

  if (esPromoCombinable && combinacion) {
    const idsPermitidos = new Set(producto.componentes.map((item) => item.componenteId));
    const totalEsperado = esPromoCombinableConVariantes
      ? primerComponente.cantidad
      : producto.componentes.reduce((total, item) => total + item.cantidad, 0);
    const totalSeleccionado = combinacion.componentes.reduce((total, item) => total + item.cantidad, 0);
    const idsSeleccionados = new Set(combinacion.componentes.map((item) => item.componenteId));
    if (
      totalSeleccionado !== totalEsperado ||
      idsSeleccionados.size !== combinacion.componentes.length ||
      combinacion.componentes.some((item) => !idsPermitidos.has(item.componenteId))
    ) {
      throw new Error(`La combinación elegida para "${producto.nombre}" no es válida`);
    }

    return combinacion.componentes.map((seleccion) => {
      const componente = producto.componentes.find((item) => item.componenteId === seleccion.componenteId)!;
      return { ...componente, cantidad: seleccion.cantidad };
    });
  }

  if (requiereVariante && !varianteId) {
    throw new Error(`Debes elegir una opción para "${producto.nombre}"`);
  }
  if (requiereVariante) {
    return producto.componentes.filter((item) => item.varianteId == null || item.varianteId === varianteId);
  }

  if (!esPromoCombinable) return producto.componentes;
  if (!combinacion) throw new Error(`Debes elegir una combinación para "${producto.nombre}"`);
  return producto.componentes;
}

export function buildStockRequirements(
  items: Array<{ producto: StockProduct; cantidadVendida: number }>
): Map<number, StockRequirement> {
  const consumos = new Map<number, StockRequirement>();

  for (const { producto, cantidadVendida } of items) {
    const requerimientos = producto.componentes.length
      ? producto.componentes.map((item) => ({
          componenteId: item.componenteId,
          componenteNombre: item.componente.nombre,
          cantidad: cantidadVendida * item.cantidad
        }))
      : producto.controlaStock
        ? [{ componenteId: producto.id, componenteNombre: producto.nombre, cantidad: cantidadVendida }]
        : [];

    for (const requerimiento of requerimientos) {
      const actual = consumos.get(requerimiento.componenteId) ?? {
        cantidad: 0,
        componenteNombre: requerimiento.componenteNombre,
        productosVendidos: new Set<string>()
      };
      actual.cantidad += requerimiento.cantidad;
      actual.productosVendidos.add(producto.nombre);
      consumos.set(requerimiento.componenteId, actual);
    }
  }

  return consumos;
}
