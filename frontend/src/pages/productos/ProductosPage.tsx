import { useCallback, useEffect, useMemo, useState } from "react";
import ErrorAlert from "../../components/ErrorAlert";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import useVoice from "../../hooks/useVoice";
import {
  createProducto,
  deleteProductImage,
  deleteProducto,
  updateProducto,
  uploadProductImage
} from "../../services/productos";
import { createCategoria, deleteCategoria, getCategorias } from "../../services/categorias";
import type { CreateProductoPayload, Producto, UpdateProductoPayload } from "../../types";
import { formatCurrency, type ProductoConCategoria } from "../../utils/pdv";
import { CategoriaDeleteModal, CategoriaFormModal } from "../../components/productos/CategoriaModals";
import { ProductoFormModal } from "../../components/productos/ProductoFormModal";
import { CategoriaBlock, EmptyProductos, type CategoriaGrupo } from "../../components/productos/ProductosCatalog";
import { ProductosToolbar } from "../../components/productos/ProductosToolbar";
import LoadingState from "../../components/ui/LoadingState";
import {
  CATEGORIAS_CATALOGO,
  mergeCategorias,
  type CategoriaCatalogo,
  type CategoriaCatalogoOption
} from "./ProductosShared";
import { useProductosCatalog } from "./hooks/useProductosCatalog";

function ProductosPage() {
  const { isVoiceEnabled } = useAccessibilityContext();
  const { speak, speakAction } = useActionVoice(isVoiceEnabled);
  const { speak: speakOnDemand } = useVoice({ enabled: isVoiceEnabled });
  const [addProductCategory, setAddProductCategory] = useState<CategoriaCatalogo | null>(null);
  const [remoteCategorias, setRemoteCategorias] = useState<CategoriaCatalogoOption[]>([]);
  const [editingProducto, setEditingProducto] = useState<ProductoConCategoria | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingProductoId, setUpdatingProductoId] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoriaCatalogo>>(new Set());
  const categoriasCatalogo = useMemo(() => mergeCategorias(remoteCategorias), [remoteCategorias]);
  const categoriasEliminables = useMemo(
    () => remoteCategorias.filter((categoria) => !CATEGORIAS_CATALOGO.some((base) => base.value === categoria.value)),
    [remoteCategorias]
  );
  const {
    activeCategory,
    error,
    grupos,
    isLoading,
    loadProductos,
    searchTerm,
    setActiveCategory,
    setError,
    setProductos,
    setSearchTerm,
    productosConCategoria
  } = useProductosCatalog({ categorias: categoriasCatalogo, includeUnavailable: true });

  const loadCategorias = useCallback(() => {
    getCategorias()
      .then((categorias) =>
        setRemoteCategorias(
          categorias.map((categoria) => ({
            id: categoria.id,
            label: categoria.nombre,
            value: categoria.nombre as CategoriaCatalogo
          }))
        )
      )
      .catch((requestError) => {
        const message = requestError instanceof Error ? requestError.message : "No fue posible cargar categorías";
        setError(message);
      });
  }, [setError]);

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    setExpandedCategories((currentCategories) => {
      const availableCategories = new Set(grupos.map((grupo) => grupo.value));
      const nextCategories = new Set([...currentCategories].filter((category) => availableCategories.has(category)));

      grupos.forEach((grupo) => {
        if (currentCategories.size === 0 || currentCategories.has(grupo.value)) {
          nextCategories.add(grupo.value);
        }
      });

      return nextCategories;
    });
  }, [grupos]);

  const sortProductos = (productos: Producto[]) => {
    return [...productos].sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));
  };

  const replaceProductoInList = (productoActualizado: Producto) => {
    setProductos((currentProductos) =>
      sortProductos(
        currentProductos.map((currentProducto) =>
          currentProducto.id === productoActualizado.id ? productoActualizado : currentProducto
        )
      )
    );
    setEditingProducto((currentProducto) =>
      currentProducto?.id === productoActualizado.id
        ? ({ ...currentProducto, ...productoActualizado } as ProductoConCategoria)
        : currentProducto
    );
  };

  const addProductoToList = (producto: Producto) => {
    setProductos((currentProductos) => sortProductos([...currentProductos, producto]));
  };

  const handleCreateProducto = async (payload: CreateProductoPayload, imageFile?: File | null) => {
    try {
      setIsCreating(true);
      setError(null);
      const producto = await createProducto(payload);
      let productoFinal = { ...producto, categoria: payload.categoria };

      if (imageFile) {
        try {
          productoFinal = { ...(await uploadProductImage(producto.id, imageFile)), categoria: payload.categoria };
          speakAction("Imagen subida correctamente.", `producto-image-uploaded:${producto.id}`, { cooldownMs: 2200 });
        } catch (imageError) {
          const message = imageError instanceof Error ? imageError.message : "No se pudo subir la imagen.";
          setError(`Producto creado, pero no se pudo subir la imagen. ${message}`);
          speak(`Producto creado, pero no se pudo subir la imagen. ${message}`, {
            priority: "high",
            dedupeKey: `producto-create-image-error:${producto.id}`,
            cooldownMs: 3000,
            interrupt: true
          });
        }
      }

      addProductoToList(productoFinal);
      setActiveCategory(payload.destacado ? "Destacados" : (payload.categoria as CategoriaCatalogo) || "Otros");
      setExpandedCategories((currentCategories) => {
        const nextCategories = new Set(currentCategories);
        nextCategories.add(payload.destacado ? "Destacados" : (payload.categoria as CategoriaCatalogo) || "Otros");
        return nextCategories;
      });
      setAddProductCategory(null);
      speakAction(`Producto agregado. ${productoFinal.nombre}.`, `producto-created:${productoFinal.id}`, {
        cooldownMs: 2500
      });
      return productoFinal;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No fue posible crear el producto";
      setError(message);
      speak(`No fue posible crear el producto. ${message}`, {
        priority: "high",
        dedupeKey: "producto-create-error",
        cooldownMs: 3000,
        interrupt: true
      });
      return undefined;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProducto = async (
    producto: Producto,
    payload: UpdateProductoPayload,
    voiceMessage?: (productoActualizado: Producto) => string
  ) => {
    try {
      setUpdatingProductoId(producto.id);
      setError(null);
      const productoActualizado = {
        ...(await updateProducto(producto.id, payload)),
        categoria: payload.categoria ?? producto.categoria
      };
      replaceProductoInList(productoActualizado);
      setEditingProducto(null);
      speakAction(
        voiceMessage?.(productoActualizado) ?? `Producto editado. ${productoActualizado.nombre}.`,
        `producto-updated:${productoActualizado.id}:${productoActualizado.disponible}`,
        { cooldownMs: 2200 }
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No fue posible actualizar el producto";
      setError(message);
      speak(`No fue posible actualizar el producto. ${message}`, {
        priority: "high",
        dedupeKey: `producto-update-error:${producto.id}`,
        cooldownMs: 3000,
        interrupt: true
      });
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const handleUploadProductoImage = async (producto: Producto, file: File) => {
    setUpdatingProductoId(producto.id);
    setError(null);

    try {
      const productoActualizado = await uploadProductImage(producto.id, file);
      replaceProductoInList(productoActualizado);
      speakAction("Imagen subida correctamente.", `producto-image-uploaded:${producto.id}`, { cooldownMs: 2200 });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No se pudo subir la imagen.";
      setError(message);
      speak(`No se pudo subir la imagen. ${message}`, {
        priority: "high",
        dedupeKey: `producto-image-upload-error:${producto.id}`,
        cooldownMs: 3000,
        interrupt: true
      });
      throw requestError;
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const handleDeleteProductoImage = async (producto: Producto) => {
    setUpdatingProductoId(producto.id);
    setError(null);

    try {
      const productoActualizado = await deleteProductImage(producto.id);
      replaceProductoInList(productoActualizado);
      speakAction("Imagen eliminada correctamente.", `producto-image-deleted:${producto.id}`, { cooldownMs: 2200 });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No se pudo eliminar la imagen.";
      setError(message);
      speak(`No se pudo eliminar la imagen. ${message}`, {
        priority: "high",
        dedupeKey: `producto-image-delete-error:${producto.id}`,
        cooldownMs: 3000,
        interrupt: true
      });
      throw requestError;
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const handleDeleteProducto = async (producto: ProductoConCategoria) => {
    const confirmed = window.confirm(`¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    setUpdatingProductoId(producto.id);
    setError(null);

    try {
      await deleteProducto(producto.id);
      setProductos((currentProductos) =>
        currentProductos.filter((currentProducto) => currentProducto.id !== producto.id)
      );
      setEditingProducto((currentProducto) => (currentProducto?.id === producto.id ? null : currentProducto));
      speakAction(`Producto eliminado. ${producto.nombre}.`, `producto-deleted:${producto.id}`, { cooldownMs: 2200 });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No fue posible eliminar el producto";
      setError(message);
      speak(`No fue posible eliminar el producto. ${message}`, {
        priority: "high",
        dedupeKey: `producto-delete-error:${producto.id}`,
        cooldownMs: 3000,
        interrupt: true
      });
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const handleRefreshProductos = () => {
    speakAction("Actualizando productos.", "productos-normal-refresh", { cooldownMs: 1200, priority: "normal" });
    loadProductos();
  };

  const handleOpenCreateProduct = () => {
    setAddProductCategory(activeCategory);
    speakAction(
      `Botón producto. Agregar producto en categoría ${activeCategory}.`,
      `producto-open-create:${activeCategory}`,
      {
        cooldownMs: 1600,
        priority: "normal"
      }
    );
  };

  const handleOpenCreateCategory = () => {
    setIsCreatingCategory(true);
    speakOnDemand("Crear categoría.", {
      priority: "high",
      dedupeKey: "producto-open-create-category",
      cooldownMs: 700,
      interrupt: true,
      force: true
    });
  };

  const handleSearchFocus = () => {
    speakOnDemand("Barra de búsqueda de productos.", {
      priority: "high",
      dedupeKey: "productos-search-bar",
      cooldownMs: 700,
      interrupt: true,
      force: true
    });
  };

  const handleCreateCategory = async (nombreCategoria: string) => {
    const label = nombreCategoria.trim();
    try {
      setError(null);
      const categoriaCreada = await createCategoria(label);
      const value = categoriaCreada.nombre as CategoriaCatalogo;

      setRemoteCategorias((currentCategorias) =>
        mergeCategorias([
          ...currentCategorias,
          {
            id: categoriaCreada.id,
            label: categoriaCreada.nombre,
            value
          }
        ]).filter((categoria) => !CATEGORIAS_CATALOGO.some((baseCategoria) => baseCategoria.value === categoria.value))
      );
      setActiveCategory(value);
      setExpandedCategories((currentCategories) => {
        const nextCategories = new Set(currentCategories);
        nextCategories.add(value);
        return nextCategories;
      });
      setIsCreatingCategory(false);
      speakOnDemand(`Categoría creada. ${categoriaCreada.nombre}.`, {
        dedupeKey: `producto-category-created:${categoriaCreada.id}`,
        cooldownMs: 1800,
        priority: "high",
        interrupt: true,
        force: true
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "No fue posible crear la categoría";
      setError(message);
      speak(`No fue posible crear la categoría. ${message}`, {
        priority: "high",
        dedupeKey: `producto-category-create-error:${label}`,
        cooldownMs: 3000,
        interrupt: true
      });
    }
  };

  const handleOpenEditProduct = (producto: ProductoConCategoria) => {
    setEditingProducto(producto);
    speakAction(
      `Boton editar. Editando ${producto.nombre}. Precio ${formatCurrency(producto.precio)}.`,
      `producto-open-edit:${producto.id}`,
      {
        cooldownMs: 1600,
        priority: "normal"
      }
    );
  };

  const handleToggleAvailability = (producto: ProductoConCategoria) => {
    const nextAvailability = (producto.disponibleConfigurado ?? producto.disponible) === false;
    speakAction(
      `Boton ${nextAvailability ? "activar" : "desactivar"} producto. ${nextAvailability ? "Activando" : "Desactivando"} ${producto.nombre}.`,
      `producto-toggle:${producto.id}:${nextAvailability}`,
      { cooldownMs: 1200, priority: "normal" }
    );
    handleUpdateProducto(
      producto,
      { disponible: nextAvailability },
      (productoActualizado) =>
        `Producto ${productoActualizado.disponible === false ? "desactivado" : "activado"}. ${productoActualizado.nombre}.`
    );
  };

  const handleSelectCategory = (grupo: CategoriaGrupo) => {
    setActiveCategory(grupo.value);
    setExpandedCategories((currentCategories) => {
      const nextCategories = new Set(currentCategories);
      nextCategories.add(grupo.value);
      return nextCategories;
    });
    speakAction(
      `Categoría ${grupo.label}. ${grupo.productos.length} productos.`,
      `producto-category-button:${grupo.value}:${grupo.productos.length}`,
      {
        cooldownMs: 1200,
        priority: "normal"
      }
    );
  };

  const handleDeleteCategory = (categoryValue: CategoriaCatalogo) => {
    const categoria = remoteCategorias.find((item) => item.value === categoryValue);
    const grupo = grupos.find((item) => item.value === categoryValue);

    if (!categoria || !grupo) return;

    if (!categoria.id) {
      const message = "No se puede eliminar una categoría sin registro en el servidor.";
      setError(message);
      speak(message, {
        priority: "high",
        dedupeKey: `producto-category-delete-missing-id:${grupo.value}`,
        cooldownMs: 2500,
        interrupt: true
      });
      return;
    }

    if (grupo.productos.length > 0) {
      const message = "Primero elimina o cambia de categoría los productos antes de borrar esta categoría.";
      setError(message);
      speak(message, {
        priority: "high",
        dedupeKey: `producto-category-delete-not-empty:${grupo.value}`,
        cooldownMs: 2500,
        interrupt: true
      });
      return;
    }

    deleteCategoria(categoria.id)
      .then(() => {
        setRemoteCategorias((currentCategorias) =>
          currentCategorias.filter((currentCategoria) => currentCategoria.value !== grupo.value)
        );
        setActiveCategory("Destacados");
        setIsDeletingCategory(false);
        setError(null);
        speakAction(`Categoría eliminada. ${grupo.label}.`, `producto-category-deleted:${categoria.id}`, {
          cooldownMs: 1800,
          priority: "normal"
        });
      })
      .catch((requestError) => {
        const message = requestError instanceof Error ? requestError.message : "No fue posible eliminar la categoría";
        setError(message);
        speak(`No fue posible eliminar la categoría. ${message}`, {
          priority: "high",
          dedupeKey: `producto-category-delete-error:${categoria.id}`,
          cooldownMs: 3000,
          interrupt: true
        });
      });
  };

  const handleToggleCategoryBlock = (grupo: CategoriaGrupo) => {
    const isCurrentlyOpen = expandedCategories.has(grupo.value);
    setExpandedCategories((currentCategories) => {
      const nextCategories = new Set(currentCategories);

      if (nextCategories.has(grupo.value)) {
        nextCategories.delete(grupo.value);
      } else {
        nextCategories.add(grupo.value);
        setActiveCategory(grupo.value);
      }

      return nextCategories;
    });
    speakAction(
      `${isCurrentlyOpen ? "Cerrando categoría" : "Abriendo categoría"} ${grupo.label}. ${grupo.productos.length} productos.`,
      `producto-category-toggle:${grupo.value}:${isCurrentlyOpen ? "close" : "open"}`,
      { cooldownMs: 1200, priority: "normal" }
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <main className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <ProductosToolbar
          activeCategory={activeCategory}
          grupos={grupos}
          isLoading={isLoading}
          onCreateCategory={handleOpenCreateCategory}
          onCreateProduct={handleOpenCreateProduct}
          onDeleteCategory={() => setIsDeletingCategory(true)}
          onRefresh={handleRefreshProductos}
          onSearchChange={setSearchTerm}
          onSearchFocus={handleSearchFocus}
          onSelectCategory={handleSelectCategory}
          searchTerm={searchTerm}
        />

        {error && <ErrorAlert message={error} />}

        {isLoading ? (
          <LoadingState label="Cargando productos..." />
        ) : grupos.length === 0 ? (
          <EmptyProductos />
        ) : (
          <section className="space-y-4">
            {grupos.map((grupo) => (
              <CategoriaBlock
                key={grupo.value}
                isExpanded={expandedCategories.has(grupo.value)}
                onAddProduct={() => {
                  setAddProductCategory(grupo.value);
                  speakAction(
                    `Botón producto. Agregar producto en categoría ${grupo.label}.`,
                    `producto-open-create:${grupo.value}`,
                    {
                      cooldownMs: 1600,
                      priority: "normal"
                    }
                  );
                }}
                onEditProduct={handleOpenEditProduct}
                onToggle={() => handleToggleCategoryBlock(grupo)}
                onToggleAvailability={handleToggleAvailability}
                grupo={grupo}
                updatingProductoId={updatingProductoId}
              />
            ))}
          </section>
        )}

        {addProductCategory && (
          <ProductoFormModal
            availableProductos={productosConCategoria}
            categoriasCatalogo={categoriasCatalogo}
            defaultCategory={addProductCategory}
            isSaving={isCreating}
            onClose={() => setAddProductCategory(null)}
            onSubmit={handleCreateProducto}
          />
        )}

        {editingProducto && (
          <ProductoFormModal
            availableProductos={productosConCategoria}
            categoriasCatalogo={categoriasCatalogo}
            defaultCategory={editingProducto.categoria}
            isSaving={updatingProductoId === editingProducto.id}
            onClose={() => setEditingProducto(null)}
            onDeleteImage={handleDeleteProductoImage}
            onDeleteProduct={handleDeleteProducto}
            onUploadImage={handleUploadProductoImage}
            onSubmit={(payload) => handleUpdateProducto(editingProducto, payload)}
            producto={editingProducto}
          />
        )}

        {isCreatingCategory && (
          <CategoriaFormModal
            categoriasCatalogo={categoriasCatalogo}
            onClose={() => setIsCreatingCategory(false)}
            onSubmit={handleCreateCategory}
          />
        )}

        {isDeletingCategory && (
          <CategoriaDeleteModal
            categorias={categoriasEliminables.map((categoria) => ({
              ...categoria,
              productosCount: grupos.find((grupo) => grupo.value === categoria.value)?.productos.length ?? 0
            }))}
            onClose={() => setIsDeletingCategory(false)}
            onSubmit={handleDeleteCategory}
          />
        )}
      </main>
    </div>
  );
}

export default ProductosPage;
