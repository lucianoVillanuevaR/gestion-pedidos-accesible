import { describe, expect, it } from "vitest";
import { buildStockRequirements, getApplicableStockComponents } from "./stockRequirementsService";

const promo = {
  id: 10,
  nombre: "2x1 Completo Italiano",
  controlaStock: false,
  componentes: [{ componenteId: 1, cantidad: 2, componente: { nombre: "Completo Italiano" } }]
};

describe("requerimientos de stock por componentes", () => {
  it("descuenta 2 unidades al vender una promo 2x1 y 4 al vender dos", () => {
    expect(buildStockRequirements([{ producto: promo, cantidadVendida: 1 }]).get(1)?.cantidad).toBe(2);
    expect(buildStockRequirements([{ producto: promo, cantidadVendida: 2 }]).get(1)?.cantidad).toBe(4);
  });

  it("acumula componentes compartidos entre promos y combos", () => {
    const combo = {
      id: 11,
      nombre: "Combo familiar",
      controlaStock: false,
      componentes: [
        { componenteId: 1, cantidad: 3, componente: { nombre: "Completo Italiano" } },
        { componenteId: 2, cantidad: 2, componente: { nombre: "Bebida" } }
      ]
    };
    const consumos = buildStockRequirements([
      { producto: promo, cantidadVendida: 2 },
      { producto: combo, cantidadVendida: 1 }
    ]);
    expect(consumos.get(1)?.cantidad).toBe(7);
    expect(consumos.get(2)?.cantidad).toBe(2);
  });

  it("usa stock propio para productos normales e ignora productos sin control", () => {
    const normal = { id: 3, nombre: "Papas", controlaStock: true, componentes: [] };
    const servicio = { id: 4, nombre: "Despacho", controlaStock: false, componentes: [] };
    const consumos = buildStockRequirements([
      { producto: normal, cantidadVendida: 3 },
      { producto: servicio, cantidadVendida: 1 }
    ]);
    expect(consumos.get(3)?.cantidad).toBe(3);
    expect(consumos.has(4)).toBe(false);
  });

  it("elige el componente alemán y descuenta cuatro al vender dos promos", () => {
    const promoConOpciones = {
      ...promo,
      componentes: [
        { componenteId: 1, cantidad: 2, varianteId: 20, componente: { nombre: "Completo Italiano" } },
        { componenteId: 2, cantidad: 2, varianteId: 21, componente: { nombre: "Completo Alemán" } }
      ]
    };
    const componentes = getApplicableStockComponents(promoConOpciones, 21);
    const consumos = buildStockRequirements([{ producto: { ...promoConOpciones, componentes }, cantidadVendida: 2 }]);
    expect(consumos.has(1)).toBe(false);
    expect(consumos.get(2)?.cantidad).toBe(4);
  });
});
