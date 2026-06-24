import { describe, expect, it } from "vitest";
import type { Producto } from "../types";
import { buildPromoCombinations } from "./promoCombinations";

describe("combinaciones automáticas de promociones", () => {
  it("crea las tres combinaciones posibles para dos productos", () => {
    const producto: Producto = {
      id: 20,
      nombre: "2x1 Italiano y Dinámico",
      precio: 2090,
      tipo: "promo",
      componentes: [
        { componenteId: 1, cantidad: 1, componente: { id: 1, nombre: "Completo Italiano" } },
        { componenteId: 2, cantidad: 1, componente: { id: 2, nombre: "Completo Dinámico" } }
      ]
    };

    expect(buildPromoCombinations(producto)).toEqual([
      { nombre: "2 × Completo Italiano", componentes: [{ componenteId: 1, cantidad: 2 }] },
      {
        nombre: "Completo Italiano + Completo Dinámico",
        componentes: [
          { componenteId: 1, cantidad: 1 },
          { componenteId: 2, cantidad: 1 }
        ]
      },
      { nombre: "2 × Completo Dinámico", componentes: [{ componenteId: 2, cantidad: 2 }] }
    ]);
  });

  it("agrega la combinación mixta a una promoción con opciones normales", () => {
    const producto: Producto = {
      id: 21,
      nombre: "2x1 Italiano o Alemán",
      precio: 3900,
      tipo: "promo",
      variantes: [
        { id: 10, productoId: 21, nombre: "Italianos" },
        { id: 11, productoId: 21, nombre: "Alemanes" }
      ],
      componentes: [
        {
          componenteId: 1,
          cantidad: 2,
          varianteId: 10,
          componente: { id: 1, nombre: "Completo Italiano" }
        },
        {
          componenteId: 2,
          cantidad: 2,
          varianteId: 11,
          componente: { id: 2, nombre: "Completo Alemán" }
        }
      ]
    };

    expect(buildPromoCombinations(producto).map((item) => item.nombre)).toEqual([
      "2 × Completo Italiano",
      "Completo Italiano + Completo Alemán",
      "2 × Completo Alemán"
    ]);
  });
});
