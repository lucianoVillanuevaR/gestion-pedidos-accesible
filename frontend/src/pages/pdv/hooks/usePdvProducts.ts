import { useCallback, useEffect, useMemo, useState } from "react";
import {
  loadCustomCategorias,
  mergeCategorias,
  withProductoCategoria,
  type CategoriaCatalogoOption
} from "../../productos/ProductosShared";
import { getProductos } from "../../../services/productos";
import type { Producto } from "../../../types";
import {
  filterProductosByCategory,
  filterProductosBySearch,
  type FiltroCategoria,
  type ProductoConCategoria
} from "../../../utils/pdv";

export function usePdvProducts({
  searchTerm,
  selectedCategory
}: {
  searchTerm: string;
  selectedCategory: FiltroCategoria;
}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const loadProductos = useCallback(() => {
    setLoadingProductos(true);
    setLoadingError(null);

    getProductos()
      .then((list) => {
        setProductos(list || []);
      })
      .catch(() => {
        setLoadingError("No fue posible cargar productos");
      })
      .finally(() => {
        setLoadingProductos(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    setLoadingProductos(true);
    setLoadingError(null);

    getProductos()
      .then((list) => {
        if (isMounted) {
          setProductos(list || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadingError("No fue posible cargar productos");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingProductos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriasCatalogo = useMemo<CategoriaCatalogoOption[]>(() => {
    const categoriasProductos = productos
      .map((producto) => producto.categoria?.trim())
      .filter((categoria): categoria is string => Boolean(categoria))
      .map((categoria) => ({ label: categoria, value: categoria }));

    return mergeCategorias([...loadCustomCategorias(), ...categoriasProductos]);
  }, [productos]);

  const categoryFilters = useMemo<Array<{ label: string; value: FiltroCategoria }>>(() => {
    return [
      ...categoriasCatalogo.map((categoria) => ({
        label: categoria.value === "Destacados" ? "Destacados" : categoria.label,
        value: categoria.value as FiltroCategoria
      })),
      { label: "Todos", value: "Todos" }
    ];
  }, [categoriasCatalogo]);

  const productosConCategoria = useMemo<ProductoConCategoria[]>(() => {
    return withProductoCategoria(productos, categoriasCatalogo);
  }, [categoriasCatalogo, productos]);

  const productosFiltrados = useMemo(() => {
    const filtradosPorCategoria = filterProductosByCategory(
      productosConCategoria,
      selectedCategory
    );

    return filterProductosBySearch(filtradosPorCategoria, searchTerm);
  }, [productosConCategoria, searchTerm, selectedCategory]);

  const accessibleProductos = useMemo(() => {
    return filterProductosByCategory(productosConCategoria, selectedCategory);
  }, [productosConCategoria, selectedCategory]);

  return {
    accessibleProductos,
    categoryFilters,
    loadingError,
    loadingProductos,
    loadProductos,
    productos,
    productosFiltrados,
    setLoadingError
  };
}
