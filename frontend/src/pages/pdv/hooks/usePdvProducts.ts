import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCategoriasCatalogo,
  filterProductosByCategoriasActivas,
  groupProductosByCategoria,
  isCategoriaActiva
} from "../../productos/ProductosShared";
import type { CategoriaCatalogoOption, CategoriaCatalogo } from "../../productos/ProductosShared";
import { getCategorias } from "../../../services/categorias";
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
  const [categorias, setCategorias] = useState<CategoriaCatalogoOption[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const loadProductos = useCallback((signal?: AbortSignal) => {
    setLoadingProductos(true);
    setLoadingError(null);

    return getProductos({ includeUnavailable: true, signal })
      .then((list) => {
        setProductos(list || []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadingError("No fue posible cargar productos");
      })
      .finally(() => {
        if (!signal?.aborted) setLoadingProductos(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadProductos(controller.signal);
    return () => controller.abort();
  }, [loadProductos]);

  useEffect(() => {
    let isMounted = true;

    getCategorias()
      .then((list) => {
        if (isMounted) {
          setCategorias(
            list.map((categoria) => ({
              activa: categoria.activa,
              id: categoria.id,
              label: categoria.nombre,
              value: categoria.nombre as CategoriaCatalogo
            }))
          );
        }
      })
      .catch(() => {
        if (isMounted) setLoadingError("No fue posible cargar categorías");
      })
      .finally(() => {
        if (isMounted) setLoadingCategorias(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriasCatalogo = useMemo(() => buildCategoriasCatalogo(productos, categorias), [categorias, productos]);
  const categoriasActivas = useMemo(
    () => categoriasCatalogo.filter((categoria) => isCategoriaActiva(categoria.value, categoriasCatalogo)),
    [categoriasCatalogo]
  );

  const productosDisponibles = useMemo(
    () => productos.filter((producto) => producto.disponible !== false),
    [productos]
  );

  const productosConCategoria = useMemo<ProductoConCategoria[]>(() => {
    if (loadingCategorias) return [];
    return filterProductosByCategoriasActivas(productosDisponibles, categoriasCatalogo);
  }, [categoriasCatalogo, loadingCategorias, productosDisponibles]);

  const categoryFilters = useMemo<Array<{ label: string; value: FiltroCategoria }>>(() => {
    if (loadingCategorias) return [];
    const productosCatalogo = filterProductosByCategoriasActivas(productos, categoriasCatalogo);
    const filtrosPorCategoria = groupProductosByCategoria(productosCatalogo, categoriasActivas).map((grupo) => ({
      label: grupo.label,
      value: grupo.value as FiltroCategoria
    }));

    return [{ label: "Todos", value: "Todos" }, ...filtrosPorCategoria];
  }, [categoriasActivas, categoriasCatalogo, loadingCategorias, productos]);

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
    loadingProductos: loadingProductos || loadingCategorias,
    loadProductos,
    productos,
    productosFiltrados,
    setLoadingError
  };
}
