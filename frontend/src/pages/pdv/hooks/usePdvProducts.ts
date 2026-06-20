import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCategoriasCatalogo,
  groupProductosByCategoria,
  loadCustomCategorias,
  withProductoCategoria
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

    getProductos({ includeUnavailable: true })
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

    getProductos({ includeUnavailable: true })
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

  const categoriasCatalogo = useMemo(() => buildCategoriasCatalogo(productos, loadCustomCategorias()), [productos]);

  const productosDisponibles = useMemo(
    () => productos.filter((producto) => producto.disponible !== false),
    [productos]
  );

  const productosConCategoria = useMemo<ProductoConCategoria[]>(() => {
    return withProductoCategoria(productosDisponibles, categoriasCatalogo);
  }, [categoriasCatalogo, productosDisponibles]);

  const categoryFilters = useMemo<Array<{ label: string; value: FiltroCategoria }>>(() => {
    const productosCatalogo = withProductoCategoria(productos, categoriasCatalogo);
    return groupProductosByCategoria(productosCatalogo, categoriasCatalogo).map((grupo) => ({
      label: grupo.label,
      value: grupo.value as FiltroCategoria
    }));
  }, [categoriasCatalogo, productos]);

  const productosFiltrados = useMemo(() => {
    const filtradosPorCategoria = filterProductosByCategory(productosConCategoria, selectedCategory);

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
