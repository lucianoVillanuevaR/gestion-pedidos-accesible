import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Save,
  Search,
  Warehouse
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import EasyModeActions from "../../components/EasyModeActions";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { getInventario, updateInventario } from "../../services/inventario";
import type { InventarioEstado, InventarioItem } from "../../types";
import { FOCUS_VISIBLE_CLASS } from "../pedidos/PedidosShared";

type InventarioFilter = InventarioEstado | "todos";

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
  const { isHighContrast } = useAccessibilityContext();
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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return inventario.filter((item) => {
      const matchesFilter = activeFilter === "todos" || item.estado === activeFilter;
      const matchesSearch = !normalizedSearch || [
        item.productoNombre,
        getEstadoLabel(item.estado, isAccessible),
        String(item.stockActual),
        String(item.stockMinimo)
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, inventario, isAccessible, searchTerm]);

  const sections = useMemo(() => {
    return ESTADO_SECTIONS.map((section) => ({
      ...section,
      items: filteredInventario.filter((item) => item.estado === section.value)
    }));
  }, [filteredInventario]);

  const loadInventario = () => {
    setIsLoading(true);
    setError(null);

    getInventario()
      .then((items) => {
        setInventario(items);
        setDraftValues(Object.fromEntries(items.map((item) => [
          item.productoId,
          {
            stockActual: String(item.stockActual),
            stockMinimo: String(item.stockMinimo)
          }
        ])));
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "No se pudo cargar inventario");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInventario();
  }, []);

  const updateDraftValue = (productoId: number, field: "stockActual" | "stockMinimo") => (event: ChangeEvent<HTMLInputElement>) => {
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
    const stockActual = parseStockValue(draft?.stockActual ?? "");
    const stockMinimo = parseStockValue(draft?.stockMinimo ?? "");

    if (stockActual === null || stockMinimo === null) {
      setError("El stock y el stock mínimo deben ser números enteros mayores o iguales a 0.");
      return;
    }

    try {
      setUpdatingProductoId(item.productoId);
      setError(null);
      setMessage(null);
      const updatedItem = await updateInventario(item.productoId, { stockActual, stockMinimo });
      setInventario((currentItems) => currentItems.map((currentItem) => (
        currentItem.productoId === updatedItem.productoId ? updatedItem : currentItem
      )));
      setDraftValues((currentValues) => ({
        ...currentValues,
        [updatedItem.productoId]: {
          stockActual: String(updatedItem.stockActual),
          stockMinimo: String(updatedItem.stockMinimo)
        }
      }));
      setMessage("Inventario actualizado correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo actualizar inventario");
    } finally {
      setUpdatingProductoId(null);
    }
  };

  const toggleSection = (estado: InventarioEstado) => {
    setCollapsedSections((currentSections) => ({
      ...currentSections,
      [estado]: !currentSections[estado]
    }));
  };

  if (isAccessible) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-5">
        <div className={`rounded-[28px] p-6 sm:p-8 ${isHighContrast ? "contrast-panel border-yellow-400" : "border-2 border-slate-900 bg-white"}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black uppercase tracking-[0.18em] text-slate-500">Modo fácil</p>
              <h1 className="mt-2 text-4xl font-black text-slate-950">Stock básico</h1>
              <p className="mt-3 text-xl font-bold text-slate-700">Revisa qué productos están disponibles o agotados.</p>
            </div>
            <div className="grid gap-3 xl:min-w-[760px]">
              <EasyModeActions />
              <button
                type="button"
                onClick={loadInventario}
                className={`inline-flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 border-slate-900 bg-white px-5 text-xl font-black text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
              >
                <RefreshCw className={`h-7 w-7 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingState label="Cargando inventario..." />
        ) : (
          <div className="grid gap-4">
            {inventario.map((item) => (
              <article key={item.productoId} className="rounded-[26px] border-2 border-slate-900 bg-white p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{item.productoNombre}</h2>
                    <p className="mt-2 text-xl font-bold text-slate-700">Stock: {item.stockActual}</p>
                  </div>
                  <span className={`inline-flex min-h-[56px] items-center justify-center rounded-2xl border-2 px-5 text-xl font-black ${getEstadoClass(item.estado)}`}>
                    {getEstadoLabel(item.estado, true)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <main className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6 2xl:max-w-[1800px]">
        <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 lg:flex-row lg:items-center lg:justify-end">
            <button
              type="button"
              onClick={loadInventario}
              disabled={isLoading}
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              Actualizar
            </button>
          </div>

          <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Buscar producto en inventario</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar producto, estado o stock"
                className={`min-h-[44px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 font-bold text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
              />
            </label>

            <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Estados de inventario">
              <FilterChip active={activeFilter === "todos"} count={counts.todos} label="Todos" onClick={() => setActiveFilter("todos")} />
              <FilterChip active={activeFilter === "sin_stock"} count={counts.sin_stock} label="Sin stock" onClick={() => setActiveFilter("sin_stock")} />
              <FilterChip active={activeFilter === "bajo_stock"} count={counts.bajo_stock} label="Bajo stock" onClick={() => setActiveFilter("bajo_stock")} />
              <FilterChip active={activeFilter === "disponible"} count={counts.disponible} label="Disponible" onClick={() => setActiveFilter("disponible")} />
            </div>
          </div>
        </section>

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status" aria-live="polite">
            <CheckCircle2 className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{message}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950" role="alert">
            <AlertTriangle className="mt-1 h-5 w-5" aria-hidden="true" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Cargando inventario..." />
        ) : filteredInventario.length === 0 ? (
          <EmptyInventario />
        ) : (
          <section className="space-y-4">
            {sections.map((section) => {
              if (section.items.length === 0) {
                return null;
              }

              const isCollapsed = collapsedSections[section.value];

              return (
                <article key={section.value} className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                  <header className="flex min-h-[54px] items-center justify-between gap-3 bg-slate-100 px-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500">
                        <Warehouse className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-500">Estado de inventario</p>
                        <h2 className="truncate text-sm font-black uppercase text-slate-950">{section.label}</h2>
                      </div>
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
                        {isCollapsed ? <ChevronDown className="h-5 w-5" aria-hidden="true" /> : <ChevronUp className="h-5 w-5" aria-hidden="true" />}
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

function FilterChip({ active, count, label, onClick }: { active: boolean; count: number; label: string; onClick: () => void }) {
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

function InventarioRow({
  draftValues,
  isSaving,
  item,
  onDraftChange,
  onSave
}: {
  draftValues?: { stockActual: string; stockMinimo: string };
  isSaving: boolean;
  item: InventarioItem;
  onDraftChange: (productoId: number, field: "stockActual" | "stockMinimo") => (event: ChangeEvent<HTMLInputElement>) => void;
  onSave: (item: InventarioItem) => void;
}) {
  return (
    <article className="grid gap-3 px-3 py-3 transition hover:bg-[#FFFDF3] lg:grid-cols-[minmax(0,1fr)_110px_110px_118px_118px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          <PackageCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{item.productoNombre}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Stock {item.stockActual} · Stock mínimo {item.stockMinimo}
          </p>
        </div>
      </div>

      <span className={`inline-flex min-h-[34px] items-center justify-center rounded-full border px-3 text-xs font-black ${getEstadoClass(item.estado)}`}>
        {getEstadoLabel(item.estado, false)}
      </span>

      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">Stock</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draftValues?.stockActual ?? ""}
          onChange={onDraftChange(item.productoId, "stockActual")}
          className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-center font-black text-slate-950 outline-none focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-black uppercase text-slate-500">Stock mínimo</span>
        <input
          type="number"
          min="0"
          step="1"
          value={draftValues?.stockMinimo ?? ""}
          onChange={onDraftChange(item.productoId, "stockMinimo")}
          className={`min-h-[40px] w-full rounded-lg border border-slate-300 px-3 text-center font-black text-slate-950 outline-none focus:border-slate-900 ${FOCUS_VISIBLE_CLASS}`}
        />
      </label>

      <button
        type="button"
        onClick={() => onSave(item)}
        disabled={isSaving}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
      >
        <Save className="h-4 w-4" aria-hidden="true" />
        {isSaving ? "Guardando..." : "Guardar"}
      </button>
    </article>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
      <span className="ml-3 font-black">{label}</span>
    </div>
  );
}

function EmptyInventario() {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-200 bg-[#FFF8DC] text-slate-950">
        <Warehouse className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="mt-5 text-2xl font-black text-slate-950">No hay productos para mostrar</p>
      <p className="mt-3 font-bold text-slate-600">Prueba con otra búsqueda o actualiza el inventario.</p>
    </div>
  );
}

export default InventarioPage;
