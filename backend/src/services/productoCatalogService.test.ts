import { describe, expect, it } from "vitest";
import { toProductoResponse } from "./productoCatalogService";

const productoBase = {
  disponible: true,
  controlaStock: false,
  imagenUrl: null
};

describe("respuesta del catálogo de productos", () => {
  it("calcula la disponibilidad de una promoción según sus componentes", () => {
    const response = toProductoResponse({
      ...productoBase,
      componentes: [
        {
          cantidad: 2,
          componente: { inventario: { stockActual: 5 } }
        }
      ]
    });

    expect(response.stockDisponible).toBe(2);
    expect(response.disponible).toBe(true);
  });

  it("elige la variante con mayor disponibilidad y exige selección", () => {
    const response = toProductoResponse({
      ...productoBase,
      componentes: [
        { cantidad: 2, varianteId: 10, componente: { inventario: { stockActual: 4 } } },
        { cantidad: 2, varianteId: 20, componente: { inventario: { stockActual: 8 } } }
      ]
    });

    expect(response.stockDisponible).toBe(4);
    expect(response.requiereSeleccionVariante).toBe(true);
  });

  it("marca como no disponible una promoción sin stock suficiente", () => {
    const response = toProductoResponse({
      ...productoBase,
      componentes: [{ cantidad: 2, componente: { inventario: { stockActual: 1 } } }]
    });

    expect(response.stockDisponible).toBe(0);
    expect(response.disponible).toBe(false);
  });
});
