import { ChevronDown, Plus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import type { CreateProductoPayload, Producto, TipoProducto } from "../../types";
import { PRODUCT_IMAGE_ACCEPT, validateProductImageFile } from "../../validations/productImage.validation";
import {
  PRODUCTO_DESCRIPCION_MAX_LENGTH,
  PRODUCTO_NOMBRE_MAX_LENGTH,
  PRODUCTO_PRECIO_MAX,
  buildProductoPayload,
  validateProductoForm
} from "../../validations/producto.validation";
import type { ProductoConCategoria } from "../../utils/pdv";
import { PRODUCT_IMAGE_PLACEHOLDER, resolveProductImage } from "../../utils/productImages";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import type { CategoriaCatalogo, CategoriaCatalogoOption } from "../../pages/productos/ProductosShared";

export function ProductoFormModal({
  availableProductos,
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
  availableProductos: ProductoConCategoria[];
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
  const [disponible, setDisponible] = useState(producto?.disponibleConfigurado ?? producto?.disponible ?? true);
  const [destacado, setDestacado] = useState(producto?.destacado ?? defaultCategory === "Destacados");
  const [tipo, setTipo] = useState<TipoProducto>(producto?.tipo ?? "producto");
  const [controlaStock, setControlaStock] = useState(producto?.controlaStock ?? true);
  const [componentes, setComponentes] = useState<
    Array<{ componenteId: number; cantidad: number; varianteId?: number }>
  >(
    producto?.componentes?.map(({ componenteId, cantidad, varianteId }) => ({
      componenteId,
      cantidad,
      ...(varianteId ? { varianteId } : {})
    })) ?? []
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentImageUrl = previewUrl || (producto ? resolveProductImage(producto) : null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
    await onSubmit(
      buildProductoPayload({
        categoria,
        descripcion,
        destacado,
        disponible,
        nombre,
        precio: precioNumerico,
        tipo,
        controlaStock,
        componentes
      }),
      pendingImageFile
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/30">
      <div className="flex min-h-full justify-center px-4 pb-6 pt-20 md:pb-8 md:pt-20">
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[calc(100vh-7rem)] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          aria-label={producto ? "Editar producto" : "Agregar producto"}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">{producto ? "Editar producto" : "Agregar producto"}</h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                Completa los datos para mostrarlo en el menú.
              </p>
            </div>
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

          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto bg-slate-50 p-4 lg:grid-cols-2 lg:items-start">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[125px_minmax(0,1fr)] lg:col-span-2">
              <div className="space-y-2">
                <div className="flex h-[125px] w-[125px] items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50">
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
                    className={`min-h-[42px] rounded-xl border border-yellow-400 bg-[#FECE00] px-3 text-sm font-black text-slate-950 transition hover:bg-[#FFD633] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
                  >
                    {currentImageUrl ? "Cambiar imagen" : "Subir imagen"}
                  </button>
                  {producto?.imagenUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={isImageSaving}
                      className={`min-h-[40px] rounded-lg border border-red-800 bg-red-700 px-3 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
                    >
                      Eliminar imagen
                    </button>
                  )}
                </div>

                {imageMessage && (
                  <p
                    className={`rounded-lg border px-2 py-1 text-xs font-bold ${imageMessage.includes("correctamente") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
                    role="status"
                  >
                    {imageMessage}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">
                    Nombre <span aria-hidden="true">*</span>
                  </span>
                  <input
                    value={nombre}
                    required
                    aria-required="true"
                    maxLength={PRODUCTO_NOMBRE_MAX_LENGTH}
                    onChange={(event) => setNombre(event.target.value)}
                    placeholder={producto ? "Nombre del producto" : "Producto nuevo"}
                    className={`min-h-[44px] w-full rounded-xl border border-slate-300 px-3 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 ${FOCUS_VISIBLE_CLASS}`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Descripción</span>
                  <textarea
                    value={descripcion}
                    maxLength={PRODUCTO_DESCRIPCION_MAX_LENGTH}
                    onChange={(event) => setDescripcion(event.target.value)}
                    placeholder="Descripción"
                    rows={3}
                    className={`h-20 w-full resize-none rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 ${FOCUS_VISIBLE_CLASS}`}
                  />
                </label>
              </div>
            </div>

            <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-black text-slate-950">Precio y disponibilidad</h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Define el precio de venta y si aparece disponible.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Precio</span>
                  <input
                    type="number"
                    min="0"
                    max={PRODUCTO_PRECIO_MAX}
                    step="0.01"
                    value={precio}
                    onChange={(event) => setPrecio(event.target.value)}
                    placeholder="CLP 0"
                    className={`min-h-[44px] w-full rounded-xl border border-slate-300 px-3 font-bold text-slate-950 outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 ${FOCUS_VISIBLE_CLASS}`}
                  />
                </label>

                <div>
                  <span className="mb-1 block text-xs font-bold text-slate-500">Estado</span>
                  <button
                    type="button"
                    onClick={() => setDisponible((current) => !current)}
                    className={`inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm font-black transition ${
                      disponible
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                    } ${FOCUS_VISIBLE_CLASS}`}
                  >
                    {disponible ? "Disponible" : "No disponible"}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-950">Tipo y control de stock</h3>
                  <p className="mt-1 text-xs font-bold leading-snug text-slate-500">
                    Las promociones y combos descuentan sus componentes.
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Tipo de producto</span>
                  <select
                    value={tipo}
                    onChange={(event) => {
                      const next = event.target.value as TipoProducto;
                      setTipo(next);
                      setControlaStock(next === "producto");
                      if (next === "producto") setComponentes([]);
                    }}
                    className={`min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-950 ${FOCUS_VISIBLE_CLASS}`}
                  >
                    <option value="producto">Producto normal</option>
                    <option value="promo">Promoción</option>
                    <option value="combo">Combo / pack</option>
                  </select>
                </label>
              </div>

              {tipo === "producto" ? (
                <label className="mt-3 flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={controlaStock}
                    onChange={(event) => setControlaStock(event.target.checked)}
                  />
                  Controla stock propio
                </label>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-black text-slate-800">Componentes que descuentan stock</p>
                  {componentes.map((item, index) => (
                    <div key={index} className="space-y-1">
                      {item.varianteId && (
                        <p className="text-xs font-black text-yellow-700">
                          Opción: {producto?.variantes?.find((variante) => variante.id === item.varianteId)?.nombre}
                        </p>
                      )}
                      <div className="grid grid-cols-[minmax(0,1fr)_80px_36px] gap-2">
                        <select
                          value={item.componenteId || ""}
                          onChange={(event) =>
                            setComponentes((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, componenteId: Number(event.target.value) } : row
                              )
                            )
                          }
                          className={`min-h-[40px] rounded-lg border border-slate-300 bg-white px-2 text-sm font-bold ${FOCUS_VISIBLE_CLASS}`}
                          aria-label={`Componente ${index + 1}`}
                        >
                          <option value="">Seleccionar producto</option>
                          {availableProductos
                            .filter((candidate) => candidate.id !== producto?.id && candidate.controlaStock !== false)
                            .map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.nombre}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.cantidad}
                          onChange={(event) =>
                            setComponentes((current) =>
                              current.map((row, rowIndex) =>
                                rowIndex === index ? { ...row, cantidad: Number(event.target.value) } : row
                              )
                            )
                          }
                          className={`min-h-[40px] rounded-lg border border-slate-300 px-2 font-bold ${FOCUS_VISIBLE_CLASS}`}
                          aria-label={`Cantidad del componente ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setComponentes((current) => current.filter((_, rowIndex) => rowIndex !== index))
                          }
                          aria-label={`Quitar componente ${index + 1}`}
                          className={`rounded-lg border border-red-200 text-red-700 ${FOCUS_VISIBLE_CLASS}`}
                        >
                          <X className="mx-auto h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setComponentes((current) => [...current, { componenteId: 0, cantidad: 1 }])}
                    className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-yellow-400 px-3 text-sm font-black ${FOCUS_VISIBLE_CLASS}`}
                  >
                    <Plus className="h-4 w-4" /> Agregar componente
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_240px] sm:items-center lg:col-span-2">
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
                className={`min-h-[42px] rounded-lg border border-slate-300 bg-white px-3 font-bold text-slate-950 outline-none focus:border-yellow-500 ${FOCUS_VISIBLE_CLASS}`}
              >
                {categoriasCatalogo.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800 lg:col-span-2 lg:mt-0">
                {formError}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row">
            {producto && onDeleteProduct && (
              <button
                type="button"
                onClick={() => onDeleteProduct(producto)}
                disabled={isSaving}
                className={`min-h-[42px] rounded-xl border border-red-800 bg-red-700 px-4 font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
              >
                Eliminar producto
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[42px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`min-h-[42px] rounded-xl border border-slate-900 bg-slate-900 px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1 ${FOCUS_VISIBLE_CLASS}`}
            >
              {isSaving ? "Guardando..." : producto ? "Guardar cambios" : "Guardar producto"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
