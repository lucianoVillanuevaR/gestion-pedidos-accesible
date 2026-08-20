import { ChevronDown, ChevronUp, PackageCheck, RefreshCw, Save, Search, Warehouse } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import EasyModeActions from "../../components/EasyModeActions";
import ErrorAlert from "../../components/ErrorAlert";
import AlertMessage from "../../components/ui/AlertMessage";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import useActionVoice from "../../hooks/useActionVoice";
import { useSoundFeedback } from "../../hooks/useSoundFeedback";
import { getInventario, updateInventario } from "../../services/inventario";
import type { InventarioEstado, InventarioItem } from "../../types";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import {
  countInventarioFacil,
  filterInventarioFacil,
  getInventarioFacilEmptyMessage,
  getInventarioFacilEstadoLabel
} from "./inventarioFacilUtils";
import {
  filterInventarioNormal,
  hasInventarioDraftChanges,
  type InventarioDraft,
  type InventarioNormalFilter
} from "./inventarioNormalUtils";

type InventarioFilter = InventarioNormalFilter;

const ESTADO_SECTIONS: Array<{ label: string; value: InventarioEstado }> = [
  { label: "Sin stock", value: "sin_stock" },
  { label: "Bajo stock", value: "bajo_stock" },
  { label: "Disponible", value: "disponible" }
];

function getEstadoLabel(estado: InventarioEstado, isAccessible: boolean) {
  if (estado === "sin_stock") {
    return "Sin stock";
  }

  if (estado === "bajo_stock") {
    return isAccessible ? "Queda poco" : "Bajo stock";
  }

  return "Disponible";
}

function getEstadoClass(estado: InventarioEstado) {
  if (estado === "sin_stock") {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (estado === "bajo_stock") {
    return "border-yellow-200 bg-[#FFF8DC] text-yellow-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function parseStockValue(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : null;
}

function InventarioPage({ isAccessible = false }: { isAccessible?: boolean }) {
  const { isHighContrast, isVoiceEnabled, isSoundEnabled, soundVolume } = useAccessibilityContext();
  const { speakAction } = useActionVoice(isVoiceEnabled);
  const soundFeedback = useSoundFeedback(isSoundEnabled, soundVolume);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [draftValues, setDraftValues] = useState<Record<number, { stockActual: string; stockMinimo: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProductoId, setUpdatingProductoId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<InventarioFilter>("todos");
  const [collapsedSections, setCollapsedSections] = useState<Record<InventarioEstado, boolean>>({
    bajo_stock: false,
    disponible: false,
    sin_stock: false
  });

  const counts = useMemo(() => {
    return {
      bajo_stock: inventario.filter((item) => item.estado === "bajo_stock").length,
      disponible: inventario.filter((item) => item.estado === "disponible").length,
      sin_stock: inventario.filter((item) => item.estado === "sin_stock").length,
      todos: inventario.length
    };
  }, [inventario]);

  const filteredInventario = useMemo(() => {
    return filterInventarioNormal(inventario, activeFilter, searchTerm, (estado) =>
      getEstadoLabel(estado, isAccessible)
    );
  }, [activeFilter, inventario, isAccessible, searchTerm]);

  const sections = useMemo(() => {
    return ESTADO_SECTIONS.map((section) => ({
      ...section,
      items: filteredInventario.filter((item) => item.estado === section.value)
    }));
  }, [filteredInventario]);
  const inventarioFacilFiltrado = useMemo(
    () => filterInventarioFacil(inventario, activeFilter, searchTerm),
    [activeFilter, inventario, searchTerm]
  );
  const conteoInventarioFacil = useMemo(() => countInventarioFacil(inventario), [inventario]);

  const loadInventario = () => {
    setIsLoading(true);
    setError(null);

    getInventario()
      .then((items) => {
        setInventario(items);
        setDraftValues(
          Object.fromEntries(
            items.map((item) => [
              item.productoId,
              {
                stockActual: String(item.stockActual),
                stockMinimo: String(item.stockMinimo)
              }
            ])
          )
        );
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "No se pudo cargar inventario");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInventario();
  }, []);

  const updateDraftValue =
    (productoId: number, field: "stockActual" | "stockMinimo") => (event: ChangeEvent<HTMLInputElement>) => {
      setDraftValues((currentValues) => ({
        ...currentValues,
        [productoId]: {
          ...currentValues[productoId],
          [field]: event.target.value
        }
      }));
    };

  const handleSave = async (item: InventarioItem) => {
    const draft = draftValues[item.productoId];

    if (!hasInventarioDraftChanges(item, draft)) {
      return;
    }

    const stockActual = parseStockValue(draft?.stockActual ?? "");
    const stockMinimo = parseStockValue(draft?.stockMinimo ?? "");

    if (stockActual === null || stockMinimo === null) {
      setError("El stock y el stock mínimo deben ser números enteros mayores o iguales a 0.");
      soundFeedback.warning();
      return;
    }

    try {
      setUpdatingProductoId(item.productoId);
      setError(null);
      setMessage(null);
      const updatedItem = await updateInventario(item.productoId, {
        stockActual,
        stockMinimo
      });
      setInventario((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.productoId === updatedItem.productoId ? updatedItem : currentItem
        )
      );
      setDraftValues((currentValues) => ({
        ...currentValues,
        [updatedItem.productoId]: {
          stockActual: String(updatedItem.stockActual),
          stockMinimo: String(updatedItem.stockMinimo)
        }
      }));
      setMessage("Inventario actualizado correctamente.");
      soundFeedback.success();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar inventario");
      soundFeedback.error();
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const toggleSection = (estado: InventarioEstado) => {
    const willExpand = collapsedSections[estado];
    speakAction(
      `${willExpand ? "Mostrar" : "Ocultar"} productos ${getEstadoLabel(estado, isAccessible)}.`,
      `inventario-seccion:${estado}:${willExpand ? "mostrar" : "ocultar"}`
    );
    setCollapsedSections((currentSections) => ({
      ...currentSections,
      [estado]: !currentSections[estado]
    }));
  };

  const handleAccessibleRefresh = () => {
    speakAction("Actualizar stock básico.", "inventario-facil-actualizar");
    loadInventario();
  };

  if (isAccessible) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-4 px-3 pb-4 pt-4 sm:px-4 sm:pt-5 lg:px-5 lg:pt-6 xl:px-6">
        <div
          className={`rounded-[28px] p-5 ${isHighContrast ? "contrast-panel border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(480px,680px)] xl:items-start">
            <div>
              <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Stock básico</h1>
              <p className="mt-2 text-lg font-bold text-slate-700">
                Revisa rápidamente qué productos tienen poco stock o están agotados.
              </p>
            </div>
            <EasyModeActions compact />
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Cargando inventario..." />
        ) : (
          <>
            <div
              className={`grid gap-3 rounded-[26px] p-4 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="relative block">
                  <span className="sr-only">Buscar producto</span>
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-600"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar producto"
                    aria-label="Buscar producto"
                    className={`min-h-[52px] w-full rounded-xl border-2 border-slate-300 bg-white py-2 pl-12 pr-4 text-lg font-black text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAccessibleRefresh}
                  aria-label="Actualizar stock básico"
                  className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-lg font-black transition ${
                    isHighContrast
                      ? "contrast-button-secondary"
                      : "border-slate-300 bg-white text-slate-950 hover:border-slate-900 hover:bg-slate-50"
                  } ${FOCUS_VISIBLE_CLASS}`}
                >
                  <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  Actualizar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de stock">
                <StockMetric label="Disponibles" value={conteoInventarioFacil.disponible} />
                <StockMetric label="Poco stock" value={conteoInventarioFacil.bajo_stock} />
                <StockMetric label="Agotados" value={conteoInventarioFacil.sin_stock} />
              </div>

              <div className="grid gap-2 sm:grid-cols-3" aria-label="Filtros de stock">
                <AccessibleStockFilter
                  active={activeFilter === "todos"}
                  label="Todos"
                  onClick={() => setActiveFilter("todos")}
                  isHighContrast={isHighContrast}
                />
                <AccessibleStockFilter
                  active={activeFilter === "bajo_stock"}
                  label="Poco stock"
                  onClick={() => setActiveFilter("bajo_stock")}
                  isHighContrast={isHighContrast}
                />
                <AccessibleStockFilter
                  active={activeFilter === "sin_stock"}
                  label="Agotados"
                  onClick={() => setActiveFilter("sin_stock")}
                  isHighContrast={isHighContrast}
                />
              </div>
            </div>

            {inventarioFacilFiltrado.length === 0 ? (
              <div
                className={`rounded-[26px] p-5 text-center text-lg font-black ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white text-slate-800"}`}
                role="status"
              >
                {getInventarioFacilEmptyMessage(activeFilter, searchTerm)}
              </div>
            ) : (
              <div className="grid gap-3">
                {inventarioFacilFiltrado.map((item) => (
                  <article
                    key={item.productoId}
                    className={`rounded-2xl px-4 py-2 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950 sm:text-xl">{item.productoNombre}</h2>
                        <p className="mt-1 text-lg font-bold text-slate-700">Stock: {item.stockActual}</p>
                      </div>
                      <AccessibleStockBadge estado={item.estado} isHighContrast={isHighContrast} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <main className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6 2xl:max-w-[1800px]">
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center xl:grid-cols-[minmax(280px,1fr)_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar producto en inventario</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto, estado o stock"
                className={`min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
              />
            </label>

            <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Estados de inventario">
              <FilterChip
                active={activeFilter === "todos"}
                count={counts.todos}
                label="Todos"
                onClick={() => setActiveFilter("todos")}
              />
              <FilterChip
                active={activeFilter === "sin_stock"}
                count={counts.sin_stock}
                label="Sin stock"
                onClick={() => setActiveFilter("sin_stock")}
              />
              <FilterChip
                active={activeFilter === "bajo_stock"}
                count={counts.bajo_stock}
                label="Bajo stock"
                onClick={() => setActiveFilter("bajo_stock")}
              />
              <FilterChip
                active={activeFilter === "disponible"}
                count={counts.disponible}
                label="Disponible"
                onClick={() => setActiveFilter("disponible")}
              />
            </div>

            <button
              type="button"
              onClick={loadInventario}
              disabled={isLoading}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 lg:col-span-2 xl:col-span-1 ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        </section>

        {message && <AlertMessage message={message} tone="success" />}

        {error && <ErrorAlert message={error} />}

        {isLoading ? (
          <LoadingState label="Cargando inventario..." />
        ) : filteredInventario.length === 0 ? (
          <EmptyInventario />
        ) : (
          <section className="space-y-3">
            <div
              className="hidden grid-cols-[minmax(0,1fr)_110px_110px_118px_140px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-black uppercase text-slate-600 lg:grid"
              aria-hidden="true"
            >
              <span>Producto</span>
              <span className="text-center">Estado</span>
              <span className="text-center">Stock</span>
              <span className="text-center">Stock mínimo</span>
              <span className="text-center">Acción</span>
            </div>
            {sections.map((section) => {
              if (section.items.length === 0) {
                return null;
              }

              const isCollapsed = collapsedSections[section.value];

              return (
                <article
                  key={section.value}
                  className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                >
                  <header className="flex min-h-[46px] items-center justify-between gap-3 bg-slate-100 px-3 py-1.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500">
                        <Warehouse className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h2 className="truncate !text-sm !leading-tight font-black uppercase text-slate-950">
                        {section.label}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-sm font-black text-slate-700">
                        {section.items.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.value)}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
                        aria-label={isCollapsed ? `Expandir ${section.label}` : `Contraer ${section.label}`}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <ChevronUp className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </header>

                  {!isCollapsed && (
                    <div className="divide-y divide-slate-100">
                      {section.items.map((item) => (
                        <InventarioRow
                          key={item.productoId}
                          draftValues={draftValues[item.productoId]}
                          isSaving={updatingProductoId === item.productoId}
                          item={item}
                          onDraftChange={updateDraftValue}
                          onSave={handleSave}
                        />
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

function StockMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 px-4 py-3">
      <p className="text-lg font-black text-slate-700">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  );
}

function AccessibleStockFilter({
  active,
  isHighContrast,
  label,
  onClick
}: {
  active: boolean;
  isHighContrast: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[48px] rounded-xl border-2 px-4 text-lg font-black transition ${
        isHighContrast
          ? active
            ? "contrast-button-primary"
            : "contrast-button-secondary"
          : active
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 bg-white text-slate-950 hover:border-slate-900"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      {label}
    </button>
  );
}

function AccessibleStockBadge({ estado, isHighContrast }: { estado: InventarioEstado; isHighContrast: boolean }) {
  return (
    <span
      className={`inline-flex min-h-[40px] items-center justify-center self-start rounded-xl border-2 px-4 text-base font-black sm:self-auto ${
        isHighContrast ? "contrast-panel-soft border-yellow-400" : getEstadoClass(estado)
      }`}
    >
      {getInventarioFacilEstadoLabel(estado)}
    </span>
  );
}

function FilterChip({
  active,
  count,
  label,
  onClick
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
        active
          ? "border-[#FECE00] bg-yellow-50 text-slate-950"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      } ${FOCUS_VISIBLE_CLASS}`}
    >
      {label}
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-xs text-slate-700">
        {count}
      </span>
    </button>
  );
}

export function InventarioRow({
  draftValues,
  isSaving,
  item,
  onDraftChange,
  onSave
}: {
  draftValues?: InventarioDraft;
  isSaving: boolean;
  item: InventarioItem;
  onDraftChange: (
    productoId: number,
    field: "stockActual" | "stockMinimo"
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
  onSave: (item: InventarioItem) => void;
}) {
  const hasChanges = hasInventarioDraftChanges(item, draftValues);

  return (
    <article className="grid gap-3 px-3 py-3 transition hover:bg-[#FFFDF3] lg:grid-cols-[minmax(0,1fr)_110px_110px_118px_140px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <PackageCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 truncate text-sm font-black text-slate-950">{item.productoNombre}</p>
      </div>

      <span
        className={`inline-flex min-h-[34px] items-center justify-center rounded-full border px-3 text-xs font-black ${getEstadoClass(item.estado)}`}
      >
        {getEstadoLabel(item.estado, false)}
      </span>

      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase text-slate-600 lg:hidden">Stock</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draftValues?.stockActual ?? ""}
          onChange={onDraftChange(item.productoId, "stockActual")}
          aria-label={`Stock de ${item.productoNombre}`}
          className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-center font-black text-slate-950 outline-none focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase text-slate-600 lg:hidden">Stock mínimo</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draftValues?.stockMinimo ?? ""}
          onChange={onDraftChange(item.productoId, "stockMinimo")}
          aria-label={`Stock mínimo de ${item.productoNombre}`}
          className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-center font-black text-slate-950 outline-none focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
        />
      </label>

      <button
        type="button"
        onClick={() => onSave(item)}
        disabled={isSaving || !hasChanges}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition disabled:cursor-not-allowed ${
          hasChanges
            ? "border-slate-900 bg-slate-900 text-white hover:bg-black disabled:opacity-60"
            : "border-slate-200 bg-slate-100 text-slate-600"
        } ${FOCUS_VISIBLE_CLASS}`}
      >
        {hasChanges && <Save className="h-4 w-4" aria-hidden="true" />}
        {isSaving ? "Guardando..." : hasChanges ? "Guardar cambios" : "Guardado"}
      </button>
    </article>
  );
}

function EmptyInventario() {
  return (
    <EmptyState
      icon={Warehouse}
      title="No hay productos para mostrar"
      message="Prueba con otra búsqueda o actualiza el inventario."
    />
  );
}

export default InventarioPage;
