import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProductos } from "../../../services/productos";
import type { Producto } from "../../../types";
import {
  filterCatalogoProductos,
  buildCategoriasCatalogo,
  groupProductosByCategoria,
  withProductoCategoria,
  CATEGORIAS_CATALOGO,
  type CategoriaCatalogoOption,
  type CategoriaCatalogo
} from "../ProductosShared";

export function useProductosCatalog({
  categorias = CATEGORIAS_CATALOGO,
  includeUnavailable = false,
  initialCategory = "Destacados"
}: {
  categorias?: CategoriaCatalogoOption[];
  includeUnavailable?: boolean;
  initialCategory?: CategoriaCatalogo;
} = {}) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoriaCatalogo>(initialCategory);
  const hasLoadedRef = useRef(false);

  const loadProductos = useCallback(async () => {
    const isInitialLoad = !hasLoadedRef.current;
    if (isInitialLoad) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const list = await getProductos({ includeUnavailable });
      setProductos(list);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No fue posible cargar productos");
    } finally {
      if (isInitialLoad) setIsLoading(false);
      else setIsRefreshing(false);
      hasLoadedRef.current = true;
    }
  }, [includeUnavailable]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const categoriasCatalogo = useMemo(() => buildCategoriasCatalogo(productos, categorias), [categorias, productos]);

  const productosConCategoria = useMemo(
    () => withProductoCategoria(productos, categoriasCatalogo),
    [categoriasCatalogo, productos]
  );

  const productosFiltrados = useMemo(() => {
    return filterCatalogoProductos(productosConCategoria, searchTerm);
  }, [productosConCategoria, searchTerm]);

  const grupos = useMemo(
    () => groupProductosByCategoria(productosFiltrados, categoriasCatalogo),
    [categoriasCatalogo, productosFiltrados]
  );

  useEffect(() => {
    if (grupos.length === 0) {
      return;
    }

    if (!grupos.some((grupo) => grupo.value === activeCategory)) {
      setActiveCategory(grupos[0].value);
    }
  }, [activeCategory, grupos]);

  const totalDestacados =
    productosConCategoria.filter((producto) => producto.destacado).length || Math.min(productosConCategoria.length, 4);

  return {
    activeCategory,
    categoriasCatalogo,
    error,
    grupos,
    isLoading,
    isRefreshing,
    loadProductos,
    productosConCategoria,
    productosFiltrados,
    searchTerm,
    setActiveCategory,
    setError,
    setProductos,
    setSearchTerm,
    totalDestacados
  };
}
