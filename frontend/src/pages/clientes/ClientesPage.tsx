import { FileSpreadsheet, Filter, MoreVertical, Plus, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { FOCUS_VISIBLE_CLASS, formatCurrency, usePedidosController } from "../pedidos/PedidosShared";

type SegmentFilter = "todos" | "elite" | "top" | "frecuente" | "comprador" | "sin_pedidos";

type ClienteRow = {
  canal: "PDV" | "Menú digital";
  estado: "Activo" | "En riesgo";
  id: string;
  nombre: string;
  puntos: number;
  segmento: SegmentFilter;
  telefono: string;
  totalComprado: number;
  totalPedidos: number;
  ultimoPedido?: string;
};

const FILTERS: Array<{ label: string; value: SegmentFilter }> = [
  { label: "Todos", value: "todos" },
  { label: "Comprador Elite", value: "elite" },
  { label: "Comprador Top", value: "top" },
  { label: "Comprador Frecuente", value: "frecuente" },
  { label: "Comprador", value: "comprador" },
  { label: "Sin pedidos", value: "sin_pedidos" }
];

const BLACK_ACTION_BUTTON_CLASS = "border border-slate-950 bg-slate-950 text-white hover:bg-black";
const LOGO_ACTIVE_FILTER_CLASS = "border-yellow-400 bg-[#FECE00] text-slate-950";

function ClientesPage() {
  const { isHighContrast } = useAccessibilityContext();
  const { error, isLoading, pedidos } = usePedidosController({});
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("todos");

  const clientes = useMemo(() => buildClientesFromPedidos(pedidos), [pedidos]);
  const filteredClientes = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return clientes.filter((cliente) => {
      const matchesFilter = segmentFilter === "todos" || cliente.segmento === segmentFilter;
      const matchesSearch = !normalizedSearch
        || normalizeText(`${cliente.nombre} ${cliente.telefono} ${cliente.canal} ${getSegmentLabel(cliente.segmento)}`).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [clientes, searchTerm, segmentFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="w-full px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">Clientes</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">{clientes.length} clientes registrados desde pedidos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className={`flex min-h-[48px] min-w-[240px] items-center gap-2 rounded-xl border px-3 shadow-sm ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-200 bg-white"}`}>
              <Search className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <span className="sr-only">Buscar cliente</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-sm transition ${isHighContrast ? "contrast-button-secondary" : BLACK_ACTION_BUTTON_CLASS} ${FOCUS_VISIBLE_CLASS}`}
            >
              <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
              Importar / Exportar
            </button>
            <button
              type="button"
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-black shadow-sm transition ${isHighContrast ? "contrast-button-primary" : BLACK_ACTION_BUTTON_CLASS} ${FOCUS_VISIBLE_CLASS}`}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Nuevo cliente
            </button>
          </div>
        </div>

        <div className={`overflow-hidden rounded-xl border ${isHighContrast ? "contrast-panel border-yellow-400" : "border-slate-200 bg-white shadow-sm"}`}>
          <div className="flex flex-col gap-3 border-b border-slate-200 px-3 py-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filtro
              </span>
              {FILTERS.map((filter) => {
                const isActive = segmentFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setSegmentFilter(filter.value)}
                    aria-pressed={isActive}
                    className={`min-h-[30px] rounded-full border px-3 text-xs font-black transition ${
                      isActive
                        ? LOGO_ACTIVE_FILTER_CLASS
                        : "border-yellow-300 bg-white text-slate-600 hover:border-yellow-400 hover:bg-[#FFF8DC]"
                    } ${FOCUS_VISIBLE_CLASS}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm font-bold text-slate-500">Total de clientes: {filteredClientes.length}</p>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800" role="alert">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[260px] items-center justify-center text-sm font-black text-slate-600">
              Cargando clientes...
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
              <UserRound className="h-12 w-12 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-xl font-black text-slate-950">No hay clientes para mostrar</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Cuando un pedido tenga nombre de cliente, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Canal de registro</th>
                    <th className="px-4 py-3">Puntos de fidelidad</th>
                    <th className="px-4 py-3">Total de pedidos</th>
                    <th className="px-4 py-3">Total comprado</th>
                    <th className="px-4 py-3">Segmento de cliente</th>
                    <th className="px-4 py-3">Estado de cliente</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-950">{cliente.nombre}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-500">{cliente.telefono}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">{cliente.canal}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{cliente.puntos}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{cliente.totalPedidos}</td>
                      <td className="px-4 py-3 font-black text-slate-950">{formatCurrency(String(cliente.totalComprado))}</td>
                      <td className="px-4 py-3">
                        <SegmentBadge segment={cliente.segmento} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill estado={cliente.estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
                          aria-label={`Abrir acciones de ${cliente.nombre}`}
                        >
                          <MoreVertical className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SegmentBadge({ segment }: { segment: SegmentFilter }) {
  const label = getSegmentLabel(segment);
  const isEmpty = segment === "sin_pedidos";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
      isEmpty ? "border-slate-200 bg-slate-50 text-slate-600" : "border-yellow-300 bg-[#FFF8DC] text-yellow-800"
    }`}>
      {label}
    </span>
  );
}

function StatusPill({ estado }: { estado: ClienteRow["estado"] }) {
  const isActive = estado === "Activo";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden="true" />
      {estado}
    </span>
  );
}

function buildClientesFromPedidos(pedidos: ReturnType<typeof usePedidosController>["pedidos"]): ClienteRow[] {
  const clientes = new Map<string, ClienteRow>();

  pedidos.forEach((pedido) => {
    const nombre = pedido.clienteNombre?.trim();

    if (!nombre) {
      return;
    }

    const id = normalizeText(nombre);
    const currentCliente = clientes.get(id);
    const total = Number(pedido.total);
    const totalComprado = Number.isNaN(total) ? 0 : total;

    if (!currentCliente) {
      clientes.set(id, {
        canal: "PDV",
        estado: getClienteEstado(pedido.createdAt),
        id,
        nombre,
        puntos: 0,
        segmento: "sin_pedidos",
        telefono: "Sin teléfono",
        totalComprado,
        totalPedidos: 1,
        ultimoPedido: pedido.createdAt
      });
      return;
    }

    currentCliente.totalPedidos += 1;
    currentCliente.totalComprado += totalComprado;

    if (isNewerDate(pedido.createdAt, currentCliente.ultimoPedido)) {
      currentCliente.ultimoPedido = pedido.createdAt;
      currentCliente.estado = getClienteEstado(pedido.createdAt);
    }
  });

  return [...clientes.values()]
    .map((cliente) => ({
      ...cliente,
      puntos: Math.floor(cliente.totalComprado / 1000),
      segmento: getSegment(cliente.totalPedidos, cliente.totalComprado)
    }))
    .sort((left, right) => left.nombre.localeCompare(right.nombre, "es"));
}

function getSegment(totalPedidos: number, totalComprado: number): SegmentFilter {
  if (totalPedidos >= 10 || totalComprado >= 100000) {
    return "elite";
  }

  if (totalPedidos >= 6 || totalComprado >= 60000) {
    return "top";
  }

  if (totalPedidos >= 3) {
    return "frecuente";
  }

  if (totalPedidos >= 1) {
    return "comprador";
  }

  return "sin_pedidos";
}

function getSegmentLabel(segment: SegmentFilter) {
  const labels: Record<SegmentFilter, string> = {
    comprador: "Comprador",
    elite: "Comprador Elite",
    frecuente: "Comprador Frecuente",
    sin_pedidos: "Sin pedidos",
    todos: "Todos",
    top: "Comprador Top"
  };

  return labels[segment];
}

function getClienteEstado(createdAt?: string): ClienteRow["estado"] {
  if (!createdAt) {
    return "En riesgo";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "En riesgo";
  }

  const daysSinceLastOrder = (Date.now() - createdDate.getTime()) / 86400000;
  return daysSinceLastOrder <= 30 ? "Activo" : "En riesgo";
}

function isNewerDate(left?: string, right?: string) {
  if (!left) {
    return false;
  }

  if (!right) {
    return true;
  }

  return new Date(left).getTime() > new Date(right).getTime();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default ClientesPage;
