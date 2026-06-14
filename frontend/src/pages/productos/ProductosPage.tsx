import { AlertTriangle, ChevronDown, Eye, EyeOff, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2, Upload, Utensils, X } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { createProducto, deleteProductImage, deleteProducto, updateProducto, uploadProductImage } from "../../services/productos";
import type { CreateProductoPayload, Producto, UpdateProductoPayload } from "../../types";
import { PRODUCT_IMAGE_ACCEPT, validateProductImageFile } from "../../validations/productImage.validation";
import {
  PRODUCTO_DESCRIPCION_MAX_LENGTH,
  PRODUCTO_NOMBRE_MAX_LENGTH,
  PRODUCTO_PRECIO_MAX,
  buildProductoPayload,
  validateProductoForm
} from "../../validations/producto.validation";
import { formatCurrency, type ProductoConCategoria } from "../../utils/pdv";
import { PRODUCT_IMAGE_PLACEHOLDER, resolveProductImage } from "../../utils/productImages";
import { FOCUS_VISIBLE_CLASS } from "../pedidos/PedidosShared";
import { CATEGORIAS_CATALOGO, type CategoriaCatalogo, type CategoriaCatalogoOption } from "./ProductosShared";
import { useProductosCatalog } from "./hooks/useProductosCatalog";

const CUSTOM_CATEGORIES_STORAGE_KEY = "riquisimo-custom-product-categories";

type CategoriaGrupo = {
  label: string;
  productos: ProductoConCategoria[];
  value: CategoriaCatalogo;
};

function ProductosPage() {
  const { isVoiceEnabled } = useAccessibilityContext();
  const { speak, speakAction } = useActionVoice(isVoiceEnabled);
  const [addProductCategory, setAddProductCategory] = useState<CategoriaCatalogo | null>(null);
  const [customCategorias, setCustomCategorias] = useState<CategoriaCatalogoOption[]>(loadCustomCategorias);
  const [editingProducto, setEditingProducto] = useState<ProductoConCategoria | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
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
    setSearchTerm
  } = useProductosCatalog({ categorias: categoriasCatalogo, includeUnavailable: true });

  const sortProductos = (productos: Producto[]) => {
    return [...productos].sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));
  };

  const replaceProductoInList = (productoActualizado: Producto) => {
    setProductos((currentProductos) =>
      sortProductos(currentProductos.map((currentProducto) => (currentProducto.id === productoActualizado.id ? productoActualizado : currentProducto)))
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
      speakAction(`Producto agregado. ${productoFinal.nombre}.`, `producto-created:${productoFinal.id}`, { cooldownMs: 2500 });
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
      setProductos((currentProductos) => currentProductos.filter((currentProducto) => currentProducto.id !== producto.id));
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
    speakAction(`Boton producto. Agregar producto en categoria ${activeCategory}.`, `producto-open-create:${activeCategory}`, {
      cooldownMs: 1600,
      priority: "normal"
    });
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

  const handleDeleteActiveCategory = () => {
    const activeGrupo = grupos.find((grupo) => grupo.value === activeCategory);

    if (!activeGrupo) {
      const message = "Selecciona una categoría para eliminar.";
      setError(message);
      speak(message, {
        priority: "high",
        dedupeKey: "producto-category-delete-no-active",
        cooldownMs: 2500,
        interrupt: true
      });
      return;
    }

    handleDeleteCategory(activeGrupo);
  };

  const handleOpenEditProduct = (producto: ProductoConCategoria) => {
    setEditingProducto(producto);
    speakAction(`Boton editar. Editando ${producto.nombre}. Precio ${formatCurrency(producto.precio)}.`, `producto-open-edit:${producto.id}`, {
      cooldownMs: 1600,
      priority: "normal"
    });
  };

  const handleToggleAvailability = (producto: ProductoConCategoria) => {
    const nextAvailability = producto.disponible === false;
    speakAction(
      `Boton ${nextAvailability ? "activar" : "desactivar"} producto. ${nextAvailability ? "Activando" : "Desactivando"} ${producto.nombre}.`,
      `producto-toggle:${producto.id}:${nextAvailability}`,
      { cooldownMs: 1200, priority: "normal" }
    );
    handleUpdateProducto(
      producto,
      { disponible: nextAvailability },
      (productoActualizado) => `Producto ${productoActualizado.disponible === false ? "desactivado" : "activado"}. ${productoActualizado.nombre}.`
    );
  };

  const handleSelectCategory = (grupo: CategoriaGrupo) => {
    setActiveCategory(grupo.value);
    speakAction(`Categoria ${grupo.label}. ${grupo.productos.length} productos.`, `producto-category-button:${grupo.value}:${grupo.productos.length}`, {
      cooldownMs: 1200,
      priority: "normal"
    });
  };

  const handleDeleteCategory = (grupo: CategoriaGrupo) => {
    const isCustomCategory = customCategorias.some((categoria) => categoria.value === grupo.value);

    if (!isCustomCategory) {
      const message = "Solo puedes eliminar categorías creadas manualmente.";
      setError(message);
      speak(message, {
        priority: "high",
        dedupeKey: `producto-category-delete-base:${grupo.value}`,
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

    const confirmed = window.confirm(`¿Eliminar la categoría "${grupo.label}"?`);

    if (!confirmed) {
      return;
    }

    const nextCategorias = customCategorias.filter((categoria) => categoria.value !== grupo.value);
    setCustomCategorias(nextCategorias);
    saveCustomCategorias(nextCategorias);
    setActiveCategory("Destacados");
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
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleOpenCreateProduct}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                Producto
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                Crear categoría
              </button>
              <button
                type="button"
                onClick={handleDeleteActiveCategory}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                Eliminar categoría
              </button>
              <button
                type="button"
                onClick={handleRefreshProductos}
                disabled={isLoading}
                className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar producto</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto, categoría o precio"
                className={`min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
              />
            </label>

            <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Categorías del menú">
              {grupos.map((grupo) => {
                const isActive = activeCategory === grupo.value;

                return (
                  <button
                    key={grupo.value}
                    type="button"
                    onClick={() => handleSelectCategory(grupo)}
                    aria-selected={isActive}
                    role="tab"
                    className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                      isActive
                        ? "border-[#FECE00] bg-yellow-50 text-slate-950"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } ${FOCUS_VISIBLE_CLASS}`}
                  >
                    {grupo.label}
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs text-slate-700">
                      {grupo.productos.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="ml-3 font-black">Cargando productos...</span>
          </div>
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
                  speakAction(`Boton producto. Agregar producto en categoria ${grupo.label}.`, `producto-open-create:${grupo.value}`, {
                    cooldownMs: 1600,
                    priority: "normal"
                  });
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
            categoriasCatalogo={categoriasCatalogo}
            defaultCategory={addProductCategory}
            isSaving={isCreating}
            onClose={() => setAddProductCategory(null)}
            onSubmit={handleCreateProducto}
          />
        )}

        {editingProducto && (
          <ProductoFormModal
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
      </main>
    </div>
  );
}

function loadCustomCategorias(): CategoriaCatalogoOption[] {
  try {
    const storedCategorias = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);

    if (!storedCategorias) {
      return [];
    }

    const parsedCategorias = JSON.parse(storedCategorias) as CategoriaCatalogoOption[];

    if (!Array.isArray(parsedCategorias)) {
      return [];
    }

    return parsedCategorias.filter((categoria) => typeof categoria?.label === "string" && typeof categoria?.value === "string");
  } catch {
    return [];
  }
}

function saveCustomCategorias(categorias: CategoriaCatalogoOption[]) {
  window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(categorias));
}

function mergeCategorias(customCategorias: CategoriaCatalogoOption[]) {
  const categoriaMap = new Map<CategoriaCatalogo, CategoriaCatalogoOption>();

  [...CATEGORIAS_CATALOGO, ...customCategorias].forEach((categoria) => {
    const label = categoria.label.trim();
    const value = String(categoria.value).trim() as CategoriaCatalogo;

    if (label && value && !categoriaMap.has(value)) {
      categoriaMap.set(value, { label, value });
    }
  });

  return [...categoriaMap.values()];
}

function CategoriaBlock({
  grupo,
  isExpanded,
  onAddProduct,
  onEditProduct,
  onToggle,
  onToggleAvailability,
  updatingProductoId
}: {
  grupo: CategoriaGrupo;
  isExpanded: boolean;
  onAddProduct: () => void;
  onEditProduct: (producto: ProductoConCategoria) => void;
  onToggle: () => void;
  onToggleAvailability: (producto: ProductoConCategoria) => void;
  updatingProductoId: number | null;
}) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
      <div className="flex min-h-[54px] items-center justify-between gap-3 bg-slate-100 px-3">
        <button
          type="button"
          onClick={onToggle}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left transition hover:bg-slate-200 ${FOCUS_VISIBLE_CLASS}`}
          aria-expanded={isExpanded}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500">
            <Utensils className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500">Nombre de categoría</span>
            <span className="block truncate text-sm font-black uppercase text-slate-950">{grupo.label}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-slate-600 shadow-sm">
            {grupo.productos.length}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddProduct();
            }}
            className={`hidden min-h-[36px] items-center justify-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-black sm:inline-flex ${FOCUS_VISIBLE_CLASS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Producto
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
            aria-label={isExpanded ? `Cerrar ${grupo.label}` : `Abrir ${grupo.label}`}
          >
            <ChevronDown className={`h-5 w-5 transition ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-slate-100">
          {grupo.productos.length === 0 ? (
            <div className="px-4 py-6 text-sm font-bold text-slate-500">
              Esta categoría aún no tiene productos.
            </div>
          ) : grupo.productos.map((producto) => (
            <ProductoRow
              key={producto.id}
              isUpdating={updatingProductoId === producto.id}
              onEditProduct={onEditProduct}
              onToggleAvailability={onToggleAvailability}
              producto={producto}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductoFormModal({
  categoriasCatalogo,
  defaultCategory,
  isSaving,
  onClose,
  onDeleteImage,
  onDeleteProduct,
  onUploadImage,
  onSubmit,
  producto
}: {
  categoriasCatalogo: CategoriaCatalogoOption[];
  defaultCategory: CategoriaCatalogo;
  isSaving: boolean;
  onClose: () => void;
  onDeleteImage?: (producto: Producto) => Promise<void>;
  onDeleteProduct?: (producto: ProductoConCategoria) => Promise<void> | void;
  onUploadImage?: (producto: Producto, file: File) => Promise<void>;
  onSubmit: (payload: CreateProductoPayload, imageFile?: File | null) => Promise<Producto | void>;
  producto?: ProductoConCategoria;
}) {
  const { isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : "");
  const [categoria, setCategoria] = useState<CategoriaCatalogo>(defaultCategory);
  const [disponible, setDisponible] = useState(producto?.disponible ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? defaultCategory === "Destacados");
  const [formError, setFormError] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentImageUrl = previewUrl || (producto ? resolveProductImage(producto) : null);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateProductImageFile(file);

    if (validationError) {
      setImageMessage(validationError);
      speak(validationError, {
        priority: "high",
        dedupeKey: `producto-image-validation:${producto?.id ?? "nuevo"}`,
        cooldownMs: 2000,
        interrupt: true
      });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setImageMessage(null);

    if (!producto) {
      setPendingImageFile(file);
      setImageMessage("Imagen lista. Se subirá al guardar el producto.");
      return;
    }

    if (!onUploadImage) {
      return;
    }

    setIsImageSaving(true);

    try {
      await onUploadImage(producto, file);
      setImageMessage("Imagen subida correctamente.");
    } catch {
      setImageMessage("No se pudo subir la imagen.");
      setPreviewUrl(null);
    } finally {
      setIsImageSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!producto || !onDeleteImage) {
      return;
    }

    setImageMessage(null);
    setIsImageSaving(true);

    try {
      await onDeleteImage(producto);
      setPreviewUrl(null);
      setImageMessage("Imagen eliminada correctamente.");
    } catch {
      setImageMessage("No se pudo eliminar la imagen.");
    } finally {
      setIsImageSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const precioNumerico = Number(precio);
    const validationError = validateProductoForm({ descripcion, nombre, precio });

    if (validationError) {
      setFormError(validationError);
      speak(validationError, {
        priority: "high",
        dedupeKey: `producto-form-error:${validationError}`,
        cooldownMs: 2000,
        interrupt: true
      });
      return;
    }

    setFormError(null);
    await onSubmit(buildProductoPayload({
      categoria,
      descripcion,
      destacado,
      disponible,
      nombre,
      precio: precioNumerico
    }), pendingImageFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[440px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-2xl"
        aria-label={producto ? "Editar producto" : "Agregar producto"}
      >
        <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-slate-200 px-4">
          <h2 className="text-base font-black text-slate-950">{producto ? "Editar producto" : "Agregar producto"}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[136px_minmax(0,1fr)]">
          <div className="space-y-2">
            <div className="flex min-h-[112px] items-center justify-center overflow-hidden rounded-lg border border-yellow-300 bg-[#FFF8DC]">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={`Imagen de ${producto?.nombre || "producto"}`}
                  onError={(event) => {
                    event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-2 px-3 text-center text-sm font-black text-slate-700">
                  <Upload className="h-6 w-6" aria-hidden="true" />
                  Sin imagen
                </span>
              )}
            </div>

            <div className="grid gap-2">
              <input
                  ref={fileInputRef}
                  type="file"
                  accept={PRODUCT_IMAGE_ACCEPT}
                onChange={handleImageChange}
                className="sr-only"
                aria-label="Seleccionar imagen del producto"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImageSaving}
                className={`min-h-[40px] rounded-lg border border-yellow-300 bg-[#FECE00] px-3 text-sm font-black text-slate-950 transition hover:bg-[#FFD633] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
              >
                {currentImageUrl ? "Cambiar imagen" : "Subir imagen"}
              </button>
              {producto?.imagenUrl && (
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  disabled={isImageSaving}
                  className={`min-h-[40px] rounded-lg border border-red-300 bg-red-50 px-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
                >
                  Eliminar imagen
                </button>
              )}
            </div>

            {imageMessage && (
              <p className={`rounded-lg border px-2 py-1 text-xs font-bold ${imageMessage.includes("correctamente") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
                {imageMessage}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">Nombre</span>
              <input
                value={nombre}
                maxLength={PRODUCTO_NOMBRE_MAX_LENGTH}
                onChange={(event) => setNombre(event.target.value)}
                placeholder={producto ? "Nombre del producto" : "Producto nuevo"}
                className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
              />
            </label>
            <label className="block">
              <span className="sr-only">Descripción</span>
              <textarea
                value={descripcion}
                maxLength={PRODUCTO_DESCRIPCION_MAX_LENGTH}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Descripción"
                rows={3}
                className={`w-full resize-none rounded-lg border border-slate-300 px-3 py-2 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
              />
            </label>
          </div>
        </div>

        <div className="border-y-8 border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-950">Precio(s)</h3>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-300 text-sm font-bold">
              <span className="bg-yellow-50 px-6 py-2 text-center text-slate-950">Simple</span>
              <span className="px-6 py-2 text-center text-slate-700">Variantes</span>
            </div>
          </div>

          <label className="mt-4 block max-w-[200px]">
            <span className="mb-1 block text-xs font-bold text-slate-500">Precio</span>
            <input
              type="number"
              min="0"
              max={PRODUCTO_PRECIO_MAX}
              step="0.01"
              value={precio}
              onChange={(event) => setPrecio(event.target.value)}
              placeholder="CLP 0"
              className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDisponible((current) => !current)}
              className={`inline-flex min-h-[30px] items-center gap-1 rounded-full px-3 text-sm font-black transition ${
                disponible ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
              } ${FOCUS_VISIBLE_CLASS}`}
            >
              {disponible ? "Disponible" : "No disponible"}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <FakeChip label="Descuento" />
          </div>
        </div>

        <div className="border-b-8 border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-950">Control de Stock</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">Disponible para venta en el catálogo.</p>
            </div>
            <button
              type="button"
              onClick={() => setDisponible((current) => !current)}
              className={`relative h-6 w-11 rounded-full transition ${disponible ? "bg-emerald-500" : "bg-slate-300"} ${FOCUS_VISIBLE_CLASS}`}
              aria-pressed={disponible}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${disponible ? "left-6" : "left-1"}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b-8 border-slate-200 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_72px] sm:items-center">
          <div>
            <h3 className="font-black text-slate-950">Agregar modificadores <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">0</span></h3>
            <p className="mt-1 text-xs font-bold text-slate-500">Ingredientes, sabores, cubiertos...</p>
          </div>
          <button
            type="button"
            className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#FECE00] bg-white text-yellow-700 transition hover:bg-yellow-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-center">
          <div>
            <h3 className="font-black text-slate-950">Categoría</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">Selecciona dónde se mostrará este producto.</p>
          </div>
          <select
            value={categoria}
            onChange={(event) => {
              const value = event.target.value as CategoriaCatalogo;
              setCategoria(value);
              setDestacado(value === "Destacados" || destacado);
            }}
            className={`min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
          >
            {categoriasCatalogo.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {formError && (
          <p className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row">
          {producto && onDeleteProduct && (
            <button
              type="button"
              onClick={() => onDeleteProduct(producto)}
              disabled={isSaving}
              className={`min-h-[44px] rounded-xl border border-red-200 bg-red-50 px-4 font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
            >
              Eliminar producto
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`min-h-[44px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
          >
            {isSaving ? "Guardando..." : producto ? "Guardar cambios" : "Guardar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoriaFormModal({
  categoriasCatalogo,
  onClose,
  onSubmit
}: {
  categoriasCatalogo: CategoriaCatalogoOption[];
  onClose: () => void;
  onSubmit: (nombreCategoria: string) => void;
}) {
  const { isVoiceEnabled } = useAccessibilityContext();
  const { speak } = useActionVoice(isVoiceEnabled);
  const [nombre, setNombre] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = nombre.trim();

    if (!cleanName) {
      const message = "Ingresa el nombre de la categoría";
      setFormError(message);
      speak(message, {
        priority: "high",
        dedupeKey: "categoria-form-error-nombre",
        cooldownMs: 2000,
        interrupt: true
      });
      return;
    }

    const alreadyExists = categoriasCatalogo.some((categoria) => categoria.label.toLowerCase() === cleanName.toLowerCase());

    if (alreadyExists) {
      const message = "Esa categoría ya existe";
      setFormError(message);
      speak(message, {
        priority: "high",
        dedupeKey: "categoria-form-error-duplicada",
        cooldownMs: 2000,
        interrupt: true
      });
      return;
    }

    setFormError(null);
    onSubmit(cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-3 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-2xl"
        aria-label="Crear categoría"
      >
        <div className="flex min-h-[52px] items-center justify-between gap-3 border-b border-slate-200 px-4">
          <h2 className="text-base font-black text-slate-950">Crear categoría</h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Nombre</span>
            <input
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej: Promociones"
              className={`min-h-[44px] w-full rounded-lg border border-slate-300 px-3 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
            />
          </label>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
              {formError}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] flex-1 rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`min-h-[44px] flex-1 rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
          >
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

function FakeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-[30px] items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700">
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}

function ProductoRow({
  isUpdating,
  onEditProduct,
  onToggleAvailability,
  producto
}: {
  isUpdating: boolean;
  onEditProduct: (producto: ProductoConCategoria) => void;
  onToggleAvailability: (producto: ProductoConCategoria) => void;
  producto: ProductoConCategoria;
}) {
  const isAvailable = producto.disponible !== false;

  return (
    <article className={`grid gap-3 px-3 py-3 transition hover:bg-[#FFFDF3] sm:grid-cols-[minmax(0,1fr)_120px_96px] sm:items-center ${isAvailable ? "" : "bg-slate-50 opacity-70"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <Utensils className="h-4 w-4" aria-hidden="true" />
        </span>
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.altText ?? producto.nombre}
            onError={(event) => {
              event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
            }}
            className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-[#FFF8DC] text-slate-700">
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{producto.nombre}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {isAvailable ? producto.destacado ? "Destacado" : producto.categoria : "Oculto"}
            {producto.descripcion ? ` · ${producto.descripcion}` : ""}
          </p>
        </div>
      </div>

      <p className="text-left text-base font-black text-slate-950 sm:text-right">{formatCurrency(producto.precio)}</p>

      <div className="flex items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => onToggleAvailability(producto)}
          disabled={isUpdating}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isAvailable
              ? "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
          } ${FOCUS_VISIBLE_CLASS}`}
          aria-label={isAvailable ? `Ocultar ${producto.nombre}` : `Mostrar ${producto.nombre}`}
        >
          {isAvailable ? <Eye className="h-5 w-5" aria-hidden="true" /> : <EyeOff className="h-5 w-5" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => onEditProduct(producto)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-yellow-200 bg-[#FFF8DC] text-slate-950 transition hover:bg-[#FFF4BF] ${FOCUS_VISIBLE_CLASS}`}
          aria-label={`Editar ${producto.nombre}`}
        >
          <Pencil className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function EmptyProductos() {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-200 bg-[#FFF8DC] text-slate-950">
        <Utensils className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-5 text-2xl font-black text-slate-950">No hay productos para mostrar</p>
      <p className="mt-3 font-bold text-slate-600">Prueba con otra búsqueda o actualiza el catálogo.</p>
    </div>
  );
}

export default ProductosPage;
