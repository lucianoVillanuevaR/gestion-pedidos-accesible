import type { CombinacionPromocion, Producto } from "../types";

export function buildPromoCombinations(producto: Producto): CombinacionPromocion[] {
  if (producto.tipo !== "promo") return [];

  const componentes = producto.componentes ?? [];
  if (componentes.length !== 2 || componentes.some((item) => !item.componente?.nombre)) {
    return [];
  }

  const [primero, segundo] = componentes;
  const usaVariantes = componentes.some((item) => item.varianteId != null);
  if (
    usaVariantes &&
    (componentes.some((item) => item.varianteId == null) ||
      primero.varianteId === segundo.varianteId ||
      primero.cantidad !== segundo.cantidad)
  ) {
    return [];
  }

  const totalUnidades = usaVariantes ? primero.cantidad : primero.cantidad + segundo.cantidad;
  if (totalUnidades < 2 || totalUnidades > 10) return [];

  const nombreCantidad = (cantidad: number, nombre: string) => (cantidad === 1 ? nombre : `${cantidad} × ${nombre}`);

  return Array.from({ length: totalUnidades + 1 }, (_, index) => {
    const cantidadPrimero = totalUnidades - index;
    const cantidadSegundo = index;
    const seleccion = [
      ...(cantidadPrimero
        ? [{ componenteId: primero.componenteId, cantidad: cantidadPrimero, nombre: primero.componente!.nombre }]
        : []),
      ...(cantidadSegundo
        ? [{ componenteId: segundo.componenteId, cantidad: cantidadSegundo, nombre: segundo.componente!.nombre }]
        : [])
    ];

    return {
      nombre: seleccion.map((item) => nombreCantidad(item.cantidad, item.nombre)).join(" + "),
      componentes: seleccion.map(({ componenteId, cantidad }) => ({ componenteId, cantidad }))
    };
  });
}
