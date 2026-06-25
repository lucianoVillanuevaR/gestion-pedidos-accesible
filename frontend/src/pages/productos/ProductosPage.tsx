import { useMemo, useState } from "react";
import ErrorAlert from "../../components/ErrorAlert";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import {
  createProducto,
  deleteProductImage,
  deleteProducto,
  updateProducto,
  uploadProductImage
} from "../../services/productos";
import type { CreateProductoPayload, Producto, UpdateProductoPayload } from "../../types";
import { formatCurrency, type ProductoConCategoria } from "../../utils/pdv";
import { CategoriaDeleteModal, CategoriaFormModal } from "../../components/productos/CategoriaModals";
import { ProductoFormModal } from "../../components/productos/ProductoFormModal";
import { CategoriaBlock, EmptyProductos, type CategoriaGrupo } from "../../components/productos/ProductosCatalog";
import { ProductosToolbar } from "../../components/productos/ProductosToolbar";
import LoadingState from "../../components/ui/LoadingState";
import {
  CATEGORIAS_CATALOGO,
  loadCustomCategorias,
  mergeCategorias,
  saveCustomCategorias,
  type CategoriaCatalogo,
  type CategoriaCatalogoOption
} from "./ProductosShared";
import { useProductosCatalog } from "./hooks/useProductosCatalog";

function ProductosPage() {
  const { isVoiceEnabled } = useAccessibilityContext();
  const { speak, speakAction } = useActionVoice(isVoiceEnabled);
  const [addProductCategory, setAddProductCategory] = useState<CategoriaCatalogo | null>(null);
  const [customCategorias, setCustomCategorias] = useState<CategoriaCatalogoOption[]>(loadCustomCategorias);
  const [editingProducto, setEditingProducto] = useState<ProductoConCategoria | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingProductoId, setUpdatingProductoId] = useState<number | null>(null);
  const categoriasCatalogo = useMemo(() => mergeCategorias(customCategorias), [customCategorias]);
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
      `Boton producto. Agregar producto en categoria ${activeCategory}.`,
      `producto-open-create:${activeCategory}`,
      {
        cooldownMs: 1600,
        priority: "normal"
      }
    );
  };

  const handleCreateCategory = (nombreCategoria: string) => {
    const label = nombreCategoria.trim();
    const value = label as CategoriaCatalogo;
    const nextCategorias = mergeCategorias([...customCategorias, { label, value }]).filter(
      (categoria) => !CATEGORIAS_CATALOGO.some((baseCategoria) => baseCategoria.value === categoria.value)
    );

    setCustomCategorias(nextCategorias);
    saveCustomCategorias(nextCategorias);
    setActiveCategory(value);
    setIsCreatingCategory(false);
    speakAction(`Categoria creada. ${label}.`, `producto-category-created:${label}`, {
      cooldownMs: 1800,
      priority: "normal"
    });
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
    speakAction(
      `Categoria ${grupo.label}. ${grupo.productos.length} productos.`,
      `producto-category-button:${grupo.value}:${grupo.productos.length}`,
      {
        cooldownMs: 1200,
        priority: "normal"
      }
    );
  };

  const handleDeleteCategory = (categoryValue: CategoriaCatalogo) => {
    const categoria = customCategorias.find((item) => item.value === categoryValue);
    const grupo = grupos.find((item) => item.value === categoryValue);

    if (!categoria || !grupo) return;

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

    const nextCategorias = customCategorias.filter((categoria) => categoria.value !== grupo.value);
    setCustomCategorias(nextCategorias);
    saveCustomCategorias(nextCategorias);
    setActiveCategory("Destacados");
    setIsDeletingCategory(false);
    setError(null);
    speakAction(`Categoria eliminada. ${grupo.label}.`, `producto-category-deleted:${grupo.value}`, {
      cooldownMs: 1800,
      priority: "normal"
    });
  };

  const handleToggleCategoryBlock = (grupo: CategoriaGrupo) => {
    const isCurrentlyOpen = activeCategory === grupo.value;
    setActiveCategory(grupo.value);
    speakAction(
      `${isCurrentlyOpen ? "Categoria abierta" : "Abriendo categoria"} ${grupo.label}. ${grupo.productos.length} productos.`,
      `producto-category-toggle:${grupo.value}:${isCurrentlyOpen ? "already-open" : "open"}`,
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
          onCreateCategory={() => setIsCreatingCategory(true)}
          onCreateProduct={handleOpenCreateProduct}
          onDeleteCategory={() => setIsDeletingCategory(true)}
          onRefresh={handleRefreshProductos}
          onSearchChange={setSearchTerm}
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
                isExpanded={activeCategory === grupo.value}
                onAddProduct={() => {
                  setAddProductCategory(grupo.value);
                  speakAction(
                    `Boton producto. Agregar producto en categoria ${grupo.label}.`,
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
            categorias={customCategorias.map((categoria) => ({
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
