import { describe, expect, it } from "vitest";
import type { Producto } from "../../types";
import {
  buildCategoriasCatalogo,
  filterCatalogoProductos,
  filterProductosByCategoriasActivas,
  groupProductosByCategoria,
  mergeCategorias,
  withProductoCategoria
} from "./ProductosShared";

describe("categorías del catálogo", () => {
  it("unifica la categoría antigua de hot dogs bajo Completos", () => {
    const productos: Producto[] = [
      {
        id: 1,
        nombre: "Completo Italiano",
        precio: 3900,
        categoria: "Completos / Hot Dogs"
      },
      {
        id: 2,
        nombre: "Completo Alemán",
        precio: 2900,
        categoria: "Completos"
      }
    ];

    const categorias = buildCategoriasCatalogo(productos);
    const productosNormalizados = withProductoCategoria(productos, categorias);

    expect(categorias.filter((categoria) => categoria.value === "Completos")).toHaveLength(1);
    expect(categorias.some((categoria) => categoria.label.includes("Hot Dog"))).toBe(false);
    expect(productosNormalizados.map((producto) => producto.categoria)).toEqual(["Completos", "Completos"]);
  });

  it("conserva el orden base y aplica id y estado recibidos del backend", () => {
    const categorias = mergeCategorias([{ activa: false, id: 12, label: "Completos", value: "Completos" }]);
    expect(categorias.find((categoria) => categoria.value === "Completos")).toMatchObject({
      activa: false,
      id: 12
    });
  });
});

describe("visibilidad de categorías en el catálogo de venta", () => {
  const categorias = [
    { activa: null, label: "Destacados", value: "Destacados" as const },
    { activa: true, id: 1, label: "Completos", value: "Completos" as const },
    { activa: false, id: 2, label: "Sandwich", value: "Sandwich" as const }
  ];
  const productos: Producto[] = [
    { categoria: "Completos", destacado: false, disponible: true, id: 1, nombre: "Completo", precio: 3000 },
    {
      categoria: "Sandwich",
      destacado: true,
      disponible: true,
      id: 2,
      nombre: "Chacarero destacado",
      precio: 5000
    },
    { categoria: "Sandwich", destacado: false, disponible: false, id: 3, nombre: "Luco oculto", precio: 4500 }
  ];

  it("excluye productos y destacados de categorías inactivas", () => {
    const visibles = filterProductosByCategoriasActivas(productos, categorias).filter(
      (producto) => producto.disponible !== false
    );
    const grupos = groupProductosByCategoria(
      visibles,
      categorias.filter((categoria) => categoria.activa !== false)
    );

    expect(visibles.map((producto) => producto.nombre)).toEqual(["Completo"]);
    expect(grupos.find((grupo) => grupo.value === "Destacados")?.productos.map((producto) => producto.nombre)).toEqual([
      "Completo"
    ]);
    expect(grupos.some((grupo) => grupo.value === "Sandwich")).toBe(false);
    expect(filterCatalogoProductos(visibles, "Chacarero")).toHaveLength(0);
  });

  it("restaura los disponibles al reactivar sin restaurar el producto individualmente oculto", () => {
    const reactivadas = categorias.map((categoria) =>
      categoria.value === "Sandwich" ? { ...categoria, activa: true } : categoria
    );
    const visibles = filterProductosByCategoriasActivas(productos, reactivadas).filter(
      (producto) => producto.disponible !== false
    );

    expect(visibles.map((producto) => producto.nombre)).toEqual(["Completo", "Chacarero destacado"]);
    expect(visibles.some((producto) => producto.nombre === "Luco oculto")).toBe(false);
  });
});
