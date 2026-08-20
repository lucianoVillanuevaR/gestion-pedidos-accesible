import { Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { PRODUCTO_CATEGORIA_MAX_LENGTH } from "../../validations/producto.validation";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import type { CategoriaCatalogo, CategoriaCatalogoOption } from "../../pages/productos/ProductosShared";

export function CategoriaFormModal({
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

    if (cleanName.length > PRODUCTO_CATEGORIA_MAX_LENGTH) {
      const message = `El nombre no puede superar ${PRODUCTO_CATEGORIA_MAX_LENGTH} caracteres`;
      setFormError(message);
      speak(message, {
        priority: "high",
        dedupeKey: "categoria-form-error-largo",
        cooldownMs: 2000,
        interrupt: true
      });
      return;
    }

    const alreadyExists = categoriasCatalogo.some(
      (categoria) => categoria.label.toLowerCase() === cleanName.toLowerCase()
    );

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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        aria-label="Nueva categoría"
      >
        <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 px-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">Nueva categoría</h2>
            <p className="mt-0.5 text-sm font-semibold text-slate-500">
              Organiza productos bajo un nombre fácil de reconocer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 bg-slate-50 p-5">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-700">
              Nombre{" "}
              <span aria-hidden="true" className="text-red-600">
                *
              </span>
            </span>
            <input
              autoFocus
              required
              aria-required="true"
              maxLength={PRODUCTO_CATEGORIA_MAX_LENGTH}
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Ej: Promociones"
              className={`min-h-[50px] w-full rounded-xl border border-slate-300 bg-white px-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 ${FOCUS_VISIBLE_CLASS}`}
            />
          </label>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
              {formError}
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-5">
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
            Crear categoría
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export function CategoriaDeleteModal({
  categoria,
  onClose,
  onSubmit
}: {
  categoria: CategoriaCatalogoOption & { productosCount: number };
  onClose: () => void;
  onSubmit: (categoria: CategoriaCatalogo) => void;
}) {
  const canDelete = categoria.productosCount === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canDelete) onSubmit(categoria.value);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        aria-labelledby="delete-category-title"
      >
        <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="delete-category-title" className="text-xl font-black text-slate-950">
                ¿Eliminar categoría &quot;{categoria.label}&quot;?
              </h2>
              <p className="text-sm font-semibold text-slate-500">No se puede deshacer esta acción.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 bg-slate-50 p-5">
          {categoria.productosCount > 0 ? (
            <div className="rounded-2xl border border-red-800 bg-red-700 p-4 text-white" role="alert">
              <p className="font-black">Esta categoría contiene {categoria.productosCount} productos</p>
              <p className="mt-1 text-sm font-semibold">Cámbialos de categoría antes de eliminarla.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
              Se eliminará <strong>{categoria.label}</strong>.
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[46px] flex-1 rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canDelete}
            className={`min-h-[46px] flex-1 rounded-xl border border-red-700 bg-red-700 px-4 font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-500 ${FOCUS_VISIBLE_CLASS}`}
          >
            Eliminar categoría
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
