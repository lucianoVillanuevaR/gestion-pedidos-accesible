export type StockRequirement = {
  cantidad: number;
  componenteNombre: string;
  productosVendidos: Set<string>;
};

export type StockProduct = {
  id: number;
  nombre: string;
  controlaStock: boolean;
  componentes: Array<{
    componenteId: number;
    cantidad: number;
    varianteId?: number | null;
    componente: { nombre: string };
  }>;
};

export function getApplicableStockComponents(producto: StockProduct, varianteId?: number) {
  const requiereVariante = producto.componentes.some((item) => item.varianteId != null);
  if (requiereVariante && !varianteId) {
    throw new Error(`Debes elegir una opción para "${producto.nombre}"`);
  }
  return producto.componentes.filter((item) => item.varianteId == null || item.varianteId === varianteId);
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
