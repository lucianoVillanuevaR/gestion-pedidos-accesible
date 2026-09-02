import { ArrowRight, Banknote, ClipboardList, ReceiptText, ShoppingBasket } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ProductImage from "../../components/productos/ProductImage";
import ErrorAlert from "../../components/ErrorAlert";
import LoadingState from "../../components/ui/LoadingState";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { getAdminDashboard } from "../../services/adminDashboard";
import type { AdminDashboardData, DashboardPeriod, EstadoPedido } from "../../types";
import { formatCurrency } from "../../utils/formatters";

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "today", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "Últimos 30 días" }
];

const STATUS_LABELS: Array<{ status: EstadoPedido; label: string }> = [
  { status: "pendiente", label: "Pendientes" },
  { status: "en_preparacion", label: "En preparación" },
  { status: "listo", label: "Listos" },
  { status: "entregado", label: "Entregados" },
  { status: "cancelado", label: "Cancelados" }
];

const panelClass = "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("7d");
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getAdminDashboard(period, controller.signal)
      .then(setData)
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "No se pudo cargar el resumen");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="flex min-h-11 items-center gap-3 font-bold text-slate-700">
          <span>Período</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
            className={`min-h-11 rounded-lg border-2 border-slate-300 bg-white px-3 font-bold text-slate-900 ${FOCUS_VISIBLE_CLASS}`}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <ErrorAlert message={error} />}
      {isLoading && !data ? <LoadingState label="Cargando resumen administrativo..." /> : null}
      {data ? <DashboardContent data={data} /> : null}
    </div>
  );
}

function DashboardContent({ data }: { data: AdminDashboardData }) {
  return (
    <>
      <section aria-label="Métricas del período" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Banknote />} label="Ventas" value={formatCurrency(data.summary.sales)} />
        <MetricCard icon={<ClipboardList />} label="Pedidos" value={data.summary.orders.toLocaleString("es-CL")} />
        <MetricCard icon={<ReceiptText />} label="Ticket promedio" value={formatCurrency(data.summary.averageTicket)} />
        <MetricCard
          icon={<ShoppingBasket />}
          label="Productos vendidos"
          value={data.summary.productsSold.toLocaleString("es-CL")}
        />
      </section>

      <SalesChart points={data.salesTimeline} period={data.period} />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <TopProductsTable products={data.topProducts} />
        <div className="grid content-start gap-4">
          <TodayOrdersSummary orders={data.ordersToday} />
          <CriticalStockSummary products={data.criticalStock} />
        </div>
      </section>

      <OrdersByHourChart points={data.ordersByHour} />
    </>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className={`${panelClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-600">{label}</h2>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FECE00] text-slate-950 [&>svg]:h-5 [&>svg]:w-5"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </article>
  );
}

function formatTimelineLabel(value: string, period: DashboardPeriod) {
  if (period === "today") return `${value.slice(11, 13)}:00`;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(" ", "-");
}

function getNiceScaleMaximum(value: number, tickCount = 4) {
  if (value <= 0) return tickCount;
  const rawStep = value / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;
  const niceStep = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  return niceStep * magnitude * tickCount;
}

function getTimelineLabelIndexes(length: number, period: DashboardPeriod) {
  if (length <= 1) return [0];
  const desiredLabels = period === "7d" ? Math.min(length, 7) : Math.min(length, 5);
  return Array.from(
    new Set(
      Array.from({ length: desiredLabels }, (_, index) => Math.round((index * (length - 1)) / (desiredLabels - 1)))
    )
  );
}

function SalesChart({ points, period }: { points: AdminDashboardData["salesTimeline"]; period: DashboardPeriod }) {
  const [activePointDate, setActivePointDate] = useState<string | null>(null);
  const [showData, setShowData] = useState(false);
  const [width, setWidth] = useState(800);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const height = 300;
  const padding = { top: 20, right: width < 500 ? 12 : 20, bottom: 40, left: width < 500 ? 68 : 82 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const scaleMaximum = getNiceScaleMaximum(Math.max(...points.map((point) => point.sales), 0));
  const yTicks = Array.from({ length: 5 }, (_, index) => (scaleMaximum * index) / 4);
  const xLabelIndexes = getTimelineLabelIndexes(points.length, period);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? padding.left + chartWidth / 2 : padding.left + (index * chartWidth) / (points.length - 1),
    y: padding.top + chartHeight - (point.sales / scaleMaximum) * chartHeight
  }));
  const activePoint = coordinates.find((point) => point.date === activePointDate) ?? null;
  const tooltipWidth = 174;
  const tooltipHeight = 64;
  const tooltipX = activePoint
    ? Math.min(Math.max(activePoint.x - tooltipWidth / 2, padding.left), width - tooltipWidth - 4)
    : 0;
  const tooltipY = activePoint ? Math.max(activePoint.y - tooltipHeight - 12, 4) : 0;

  useEffect(() => {
    setShowData(false);
  }, [period]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const updateWidth = (nextWidth: number) => {
      if (nextWidth > 0) setWidth(Math.round(nextWidth));
    };
    updateWidth(container.getBoundingClientRect().width);

    const observer = new ResizeObserver(([entry]) => updateWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={panelClass} aria-labelledby="sales-chart-title">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 id="sales-chart-title" className="text-lg font-black text-slate-950">
          Ventas
        </h2>
        <p className="text-sm font-semibold text-slate-500">Evolución durante el período seleccionado</p>
      </header>
      {points.length === 0 ? (
        <p className="px-4 py-12 text-center font-bold text-slate-600">No hay ventas en este período.</p>
      ) : (
        <div className="px-3 pb-3 pt-4 sm:px-4" ref={chartContainerRef}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[250px] w-full sm:h-[300px]"
            role="img"
            aria-label="Gráfico de evolución de ventas"
            onMouseLeave={() => setActivePointDate(null)}
          >
            {yTicks.map((tick) => {
              const y = padding.top + chartHeight - (tick / scaleMaximum) * chartHeight;
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    opacity="0.65"
                  />
                  <text x={padding.left - 10} y={y + 5} textAnchor="end" fill="#475569" fontSize="14">
                    {formatCurrency(tick)}
                  </text>
                </g>
              );
            })}
            <polyline
              points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke="#CA8A04"
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coordinates.map((point) => (
              <circle
                key={point.date}
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#FECE00"
                stroke="#0F172A"
                strokeWidth="2.5"
                tabIndex={0}
                aria-label={`${formatTimelineLabel(point.date, period)}. Ventas: ${formatCurrency(point.sales)}. Pedidos: ${point.orders}.`}
                onMouseEnter={() => setActivePointDate(point.date)}
                onFocus={() => setActivePointDate(point.date)}
                onBlur={() => setActivePointDate(null)}
                className="outline-none focus:stroke-[4]"
              >
                <title>{`${formatTimelineLabel(point.date, period)}: ${formatCurrency(point.sales)}, ${point.orders} pedidos`}</title>
              </circle>
            ))}
            {xLabelIndexes.map((pointIndex, labelIndex) => {
              const point = coordinates[pointIndex];
              const textAnchor =
                labelIndex === 0 ? "start" : labelIndex === xLabelIndexes.length - 1 ? "end" : "middle";
              return (
                <text key={point.date} x={point.x} y={height - 10} textAnchor={textAnchor} fill="#475569" fontSize="14">
                  {formatTimelineLabel(point.date, period)}
                </text>
              );
            })}
            {activePoint ? (
              <g pointerEvents="none" aria-hidden="true">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="7"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                />
                <text x={tooltipX + 10} y={tooltipY + 18} fill="#0F172A" fontSize="13" fontWeight="700">
                  {formatTimelineLabel(activePoint.date, period)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 37} fill="#334155" fontSize="13">
                  Ventas: {formatCurrency(activePoint.sales)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 55} fill="#334155" fontSize="13">
                  Pedidos: {activePoint.orders}
                </text>
              </g>
            ) : null}
          </svg>
          <details open={showData} className="mt-2 rounded-lg border border-slate-200 px-3 py-2">
            <summary
              aria-expanded={showData}
              onClick={(event) => {
                event.preventDefault();
                setShowData((current) => !current);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setShowData((current) => !current);
              }}
              className={`cursor-pointer font-bold text-slate-700 ${FOCUS_VISIBLE_CLASS}`}
            >
              Ver datos del gráfico
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {points.map((point) => (
                <p key={point.date} className="text-sm text-slate-700">
                  <strong>{formatTimelineLabel(point.date, period)}:</strong> {formatCurrency(point.sales)} ·{" "}
                  {point.orders} pedidos
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

function TopProductsTable({ products }: { products: AdminDashboardData["topProducts"] }) {
  return (
    <section className={panelClass} aria-labelledby="top-products-title">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 id="top-products-title" className="text-lg font-black text-slate-950">
          Productos más vendidos
        </h2>
        <p className="text-sm font-semibold text-slate-500">Ordenados por cantidad vendida</p>
      </header>
      {products.length === 0 ? (
        <p className="px-4 py-10 text-center font-bold text-slate-600">No hay productos vendidos en este período.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          <div className="hidden grid-cols-[minmax(0,1fr)_110px_130px] gap-3 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-600 sm:grid">
            <span>Producto</span>
            <span className="text-right">Cantidad</span>
            <span className="text-right">Ventas</span>
          </div>
          {products.map((product) => (
            <article
              key={product.productId}
              className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProductImage
                  src={product.imageUrl}
                  alt=""
                  className="h-11 w-14 shrink-0 rounded-md object-cover"
                  emptyClassName="flex h-11 w-14 shrink-0 items-center justify-center rounded-md bg-yellow-50 text-slate-600"
                  emptyLabel="icon"
                />
                <p className="min-w-0 font-bold text-slate-900">{product.productName}</p>
              </div>
              <p className="flex justify-between text-sm text-slate-700 sm:block sm:text-right">
                <span className="font-semibold sm:hidden">Cantidad</span>
                <strong>{product.quantity}</strong>
              </p>
              <p className="flex justify-between text-sm text-slate-700 sm:block sm:text-right">
                <span className="font-semibold sm:hidden">Ventas</span>
                <strong>{formatCurrency(product.sales)}</strong>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TodayOrdersSummary({ orders }: { orders: AdminDashboardData["ordersToday"] }) {
  return (
    <section className={panelClass} aria-labelledby="today-orders-title">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 id="today-orders-title" className="text-lg font-black text-slate-950">
          Pedidos de hoy
        </h2>
        <p className="text-sm font-semibold text-slate-500">Estado actual, independiente del período</p>
      </header>
      <dl className="divide-y divide-slate-100 px-4">
        {STATUS_LABELS.map(({ status, label }) => (
          <div key={status} className="flex min-h-10 items-center justify-between gap-3 py-2">
            <dt className="font-semibold text-slate-600">{label}</dt>
            <dd className="font-black text-slate-950">{orders[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CriticalStockSummary({ products }: { products: AdminDashboardData["criticalStock"] }) {
  return (
    <section className={panelClass} aria-labelledby="critical-stock-title">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 id="critical-stock-title" className="text-lg font-black text-slate-950">
          Stock crítico
        </h2>
        <p className="text-sm font-semibold text-slate-500">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </p>
      </header>
      {products.length === 0 ? (
        <p className="px-4 py-6 font-bold text-slate-600">No hay productos con stock crítico.</p>
      ) : (
        <ul className="divide-y divide-slate-100 px-4">
          {products.map((product) => (
            <li key={product.productId} className="flex items-center justify-between gap-3 py-2.5">
              <span className="font-semibold text-slate-700">{product.productName}</span>
              <strong className="whitespace-nowrap text-slate-950">
                {product.currentStock} / {product.minimumStock}
              </strong>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-slate-100 p-3">
        <Link
          to="/admin/inventario"
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 font-bold text-white hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
        >
          Ver inventario <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function OrdersByHourChart({ points }: { points: AdminDashboardData["ordersByHour"] }) {
  const max = Math.max(...points.map((point) => point.orders), 1);
  const chronologicalPoints = [...points].sort((left, right) => left.hour - right.hour);
  return (
    <section className={panelClass} aria-labelledby="orders-hour-title">
      <header className="border-b border-slate-100 px-4 py-3">
        <h2 id="orders-hour-title" className="text-lg font-black text-slate-950">
          Pedidos por hora
        </h2>
        <p className="text-sm font-semibold text-slate-500">Distribución del período seleccionado</p>
      </header>
      {points.length === 0 ? (
        <p className="px-4 py-10 text-center font-bold text-slate-600">No hay pedidos en este período.</p>
      ) : (
        <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {chronologicalPoints.map((point) => (
            <div key={point.hour} className="grid grid-cols-[52px_minmax(0,1fr)_34px] items-center gap-2 text-sm">
              <span className="font-bold text-slate-700">{String(point.hour).padStart(2, "0")}:00</span>
              <span className="h-5 overflow-hidden rounded bg-slate-100">
                <span
                  className="block h-full rounded bg-[#FECE00]"
                  style={{ width: `${Math.max((point.orders / max) * 100, 4)}%` }}
                />
              </span>
              <strong className="text-right text-slate-950">{point.orders}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
