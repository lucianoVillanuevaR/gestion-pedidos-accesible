import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  Printer,
  Store,
  WalletCards,
  X
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import EasyModeActions from "../../components/EasyModeActions";
import ErrorAlert from "../../components/ErrorAlert";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { useAuthContext } from "../../contexts/AuthContext";
import useActionVoice from "../../hooks/useActionVoice";
import { abrirTurnoRemoto, guardarCierreTurno, sincronizarTurnoActual } from "../../services/cierresTurno";
import type { CierreProductoResumen } from "../../types";
import { getResponsableDisplay, type ResponsableDisplay } from "../../utils/turnoResponsable";
import { validateTurnoClose } from "../../validations/turno.validation";
import {
  ESTADO_META,
  formatCurrency,
  formatDateTime,
  formatMetodoPago,
  formatTime,
  getCierrePedidosResumen,
  getFechaInicioTurno,
  getPedidoDisplayNumber,
  getProductosVendidosResumen,
  getTurnoSummary,
  readTurnoAbierto,
  setTurnoAbierto,
  setTurnoFechaInicio,
  StatusBadge,
  usePedidosController
} from "./PedidosShared";

function CierreTurnoPage() {
  const { isAccessible, isHighContrast, isVoiceEnabled } = useAccessibilityContext();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { speakAction } = useActionVoice(isVoiceEnabled);
  const [isTurnoOpen, setIsTurnoOpen] = useState(() => readTurnoAbierto());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [expandedEasySections, setExpandedEasySections] = useState({
    metodos: false,
    pedidos: false,
    productos: false
  });

  useEffect(() => {
    void sincronizarTurnoActual()
      .then((turno) => {
        setTurnoAbierto(Boolean(turno));
        if (turno) setTurnoFechaInicio(turno.fechaInicio);
        setIsTurnoOpen(Boolean(turno));
      })
      .catch(() => undefined);
  }, []);

  const { error, isLoading, loadPedidos, pedidos } = usePedidosController({});

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const summary = useMemo(() => getTurnoSummary(pedidos), [pedidos]);
  const fechaInicio = useMemo(() => getFechaInicioTurno(pedidos), [pedidos]);
  const productosVendidos = useMemo(() => getProductosVendidosResumen(pedidos), [pedidos]);
  const pedidosDetalle = useMemo(() => getCierrePedidosResumen(pedidos), [pedidos]);
  const responsable = useMemo(
    () => getResponsableDisplay(user ? { label: user.label, role: user.role, username: user.username } : undefined),
    [user]
  );
  const hasPedidosPendientes = summary.pedidosPendientes > 0;

  const handleAbrirTurno = async () => {
    try {
      const turno = await abrirTurnoRemoto();
      setTurnoAbierto(true);
      setTurnoFechaInicio(turno.fechaInicio);
      setIsTurnoOpen(true);
      setMessage("Turno abierto. Ya puedes registrar nuevos pedidos.");
      speakAction("Turno abierto.", "cierre-abrir-turno");
      loadPedidos();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No fue posible abrir el turno.");
    }
  };

  const handleCerrarTurno = async () => {
    const closeError = validateTurnoClose(isTurnoOpen);
    if (closeError) {
      setMessage(closeError);
      setIsConfirmOpen(false);
      return;
    }

    try {
      setIsSaving(true);
      const cierre = await guardarCierreTurno();
      setTurnoAbierto(false);
      setIsTurnoOpen(false);
      setIsConfirmOpen(false);
      setMessage("Turno cerrado correctamente.");
      speakAction("Turno cerrado correctamente.", `cierre-turno:${cierre.id}`);
      await loadPedidos();
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "No fue posible cerrar el turno.");
    } finally {
      setIsSaving(false);
    }
  };

  const pageClass = isHighContrast ? "bg-black text-white" : "bg-[#F7F7F7] text-slate-950";
  const panelClass = isHighContrast
    ? "contrast-panel border-2 border-yellow-400"
    : "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]";
  const buttonSizeClass = isAccessible ? "min-h-[58px] text-lg" : "min-h-[46px] text-sm";

  return (
    <div className={`min-h-screen ${pageClass}`}>
      <main className="mx-auto w-full max-w-none space-y-5 px-3 py-4 sm:px-4 lg:px-5 xl:px-6 2xl:px-8">
        {isAccessible ? (
          <section
            className={`rounded-[28px] p-5 sm:p-6 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-2 border-slate-900 bg-white"}`}
          >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Modo fácil</p>
                <h1 className="mt-2 text-4xl font-black text-slate-950">Cierre de turno</h1>
                <p className="mt-3 text-xl font-bold text-slate-700">Revisa el resumen antes de cerrar el turno.</p>
              </div>
              <EasyModeActions className="xl:min-w-[760px]" />
            </div>
          </section>
        ) : (
          <CierreHeader
            buttonSizeClass={buttonSizeClass}
            fechaInicio={fechaInicio}
            isAccessible={isAccessible}
            isHighContrast={isHighContrast}
            isTurnoOpen={isTurnoOpen}
            now={now}
            onAbrirTurno={handleAbrirTurno}
            onCerrarTurno={() => setIsConfirmOpen(true)}
            onPrint={() => window.print()}
            responsable={responsable}
          />
        )}

        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 font-black ${isHighContrast ? "contrast-panel" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
            role="status"
          >
            {message}
          </div>
        )}

        {error && <ErrorAlert isHighContrast={isHighContrast} message={error} />}

        {isLoading ? (
          <div className={`flex min-h-[280px] items-center justify-center rounded-[18px] ${panelClass}`}>
            <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
            <span className="ml-3 font-black">Cargando resumen del turno...</span>
          </div>
        ) : isAccessible ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Resumen esencial de cierre">
              <MetricCard
                label="Total vendido confirmado"
                value={formatCurrency(String(summary.totalVendido))}
                variant="strong"
              />
              <MetricCard label="Pedidos entregados" value={String(summary.pedidosEntregados)} />
              <MetricCard label="Pedidos pendientes" value={String(summary.pedidosPendientes)} />
            </section>

            {hasPedidosPendientes && (
              <p className="rounded-2xl border-2 border-yellow-300 bg-[#FFF8DC] px-5 py-4 text-xl font-black text-yellow-950">
                Hay pedidos pendientes. Puedes revisarlos antes de cerrar.
              </p>
            )}

            <section className="grid gap-3" aria-label="Acciones de cierre de turno">
              <button
                type="button"
                onClick={isTurnoOpen ? () => setIsConfirmOpen(true) : handleAbrirTurno}
                className={`inline-flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-2 px-5 text-xl font-black transition ${isTurnoOpen ? "border-red-800 bg-red-700 text-white hover:bg-red-800" : "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700"} ${FOCUS_VISIBLE_CLASS}`}
              >
                <Check className="h-6 w-6" aria-hidden="true" />
                {isTurnoOpen ? "Cerrar turno" : "Abrir turno"}
              </button>
            </section>

            <EasyDisclosure
              isExpanded={expandedEasySections.metodos}
              onToggle={() => setExpandedEasySections((current) => ({ ...current, metodos: !current.metodos }))}
              title="Ver métodos de pago"
            >
              <PaymentMethodsPanel panelClass={panelClass} summary={summary} />
            </EasyDisclosure>
            <EasyDisclosure
              isExpanded={expandedEasySections.productos}
              onToggle={() => setExpandedEasySections((current) => ({ ...current, productos: !current.productos }))}
              title="Ver productos vendidos"
            >
              <ProductosVendidosPanel panelClass={panelClass} productosVendidos={productosVendidos} />
            </EasyDisclosure>
            <EasyDisclosure
              isExpanded={expandedEasySections.pedidos}
              onToggle={() => setExpandedEasySections((current) => ({ ...current, pedidos: !current.pedidos }))}
              title="Ver pedidos del turno"
            >
              <PedidosTurnoPanel panelClass={panelClass} pedidos={pedidosDetalle} />
            </EasyDisclosure>
          </>
        ) : (
          <>
            <section
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
              aria-label="Indicadores principales de cierre"
            >
              <MetricCard
                label="Total vendido confirmado"
                value={formatCurrency(String(summary.totalVendido))}
                variant="strong"
              />
              <MetricCard label="Pedidos entregados" value={String(summary.pedidosEntregados)} />
              <MetricCard label="Pedidos pendientes" value={String(summary.pedidosPendientes)} />
              <MetricCard label="Pedidos cancelados" value={String(summary.pedidosCancelados)} />
            </section>

            <section className="grid items-start gap-5 xl:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.7fr)] 2xl:grid-cols-[minmax(390px,0.62fr)_minmax(0,1.85fr)]">
              <PaymentMethodsPanel panelClass={panelClass} summary={summary} />
              <ProductosVendidosPanel panelClass={panelClass} productosVendidos={productosVendidos} />
            </section>

            <PedidosTurnoPanel panelClass={panelClass} pedidos={pedidosDetalle} />
          </>
        )}

        {isConfirmOpen && (
          <CerrarTurnoModal
            hasPedidosPendientes={hasPedidosPendientes}
            isSaving={isSaving}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleCerrarTurno}
            onReviewPedidos={() => navigate("/pedidos/facil")}
          />
        )}

        <section className="historial-print-turno historial-print-target" aria-hidden="true">
          <CierreTurnoPrintable
            fechaCierre={now.toISOString()}
            fechaInicio={fechaInicio}
            pedidos={pedidosDetalle}
            productosVendidos={productosVendidos}
            responsable={responsable}
            summary={summary}
          />
        </section>
      </main>
    </div>
  );
}

function CierreTurnoPrintable({
  fechaCierre,
  fechaInicio,
  pedidos,
  productosVendidos,
  responsable,
  summary
}: {
  fechaCierre: string;
  fechaInicio?: string;
  pedidos: ReturnType<typeof getCierrePedidosResumen>;
  productosVendidos: CierreProductoResumen[];
  responsable: ResponsableDisplay;
  summary: ReturnType<typeof getTurnoSummary>;
}) {
  const paymentRows = [
    { label: "Efectivo", value: summary.totalEfectivo },
    { label: "Tarjeta", value: summary.totalTarjeta },
    { label: "Transferencia", value: summary.totalTransferencia }
  ];

  return (
    <section className="historial-print-only">
      <h1>Riquísimo</h1>
      <p>Sistema de Pedidos - Resumen de turno cerrado</p>

      <div className="historial-print-grid">
        <p>
          <strong>Fecha del turno:</strong> {formatDateTime(fechaCierre)}
        </p>
        <p>
          <strong>{responsable.primaryLabel}:</strong> {responsable.primaryValue}
        </p>
        {responsable.roleValue && (
          <p>
            <strong>Rol:</strong> {responsable.roleValue}
          </p>
        )}
        <p>
          <strong>Inicio:</strong> {fechaInicio ? formatDateTime(fechaInicio) : "Sin datos"}
        </p>
        <p>
          <strong>Cierre:</strong> {formatDateTime(fechaCierre)}
        </p>
        <p>
          <strong>Total vendido confirmado:</strong> {formatCurrency(String(summary.totalVendido))}
        </p>
        <p>
          <strong>Pedidos entregados:</strong> {summary.pedidosEntregados}
        </p>
        <p>
          <strong>Pedidos pendientes:</strong> {summary.pedidosPendientes}
        </p>
        <p>
          <strong>Pedidos cancelados:</strong> {summary.pedidosCancelados}
        </p>
      </div>

      <h2>Métodos de pago</h2>
      {paymentRows.map((row) => (
        <p key={row.label}>
          <strong>{row.label}:</strong> {formatCurrency(String(row.value))}
        </p>
      ))}

      <h2>Productos vendidos</h2>
      {productosVendidos.length === 0 ? (
        <p>No hay productos vendidos confirmados.</p>
      ) : (
        productosVendidos.map((producto) => (
          <p key={producto.productoId}>
            {producto.cantidad}x {producto.productoNombre} - {formatCurrency(String(producto.total))}
          </p>
        ))
      )}

      <h2>Pedidos del turno</h2>
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Estado</th>
            <th>Hora</th>
            <th>Método</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td>#{getPedidoDisplayNumber(pedido)}</td>
              <td>{ESTADO_META[pedido.estado].label}</td>
              <td>{formatTime(pedido.createdAt)}</td>
              <td>{formatMetodoPago(pedido.metodoPago)}</td>
              <td>{formatCurrency(String(pedido.total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CierreHeader({
  buttonSizeClass,
  fechaInicio,
  isAccessible,
  isHighContrast,
  isTurnoOpen,
  now,
  onAbrirTurno,
  onCerrarTurno,
  onPrint,
  responsable
}: {
  buttonSizeClass: string;
  fechaInicio?: string;
  isAccessible: boolean;
  isHighContrast: boolean;
  isTurnoOpen: boolean;
  now: Date;
  onAbrirTurno: () => void;
  onCerrarTurno: () => void;
  onPrint: () => void;
  responsable: ResponsableDisplay;
}) {
  return (
    <header
      className={`rounded-[18px] border px-4 py-5 ${isHighContrast ? "contrast-panel border-2 border-yellow-400" : "border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]"}`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.8fr)_minmax(620px,1fr)] xl:items-start">
        <div>
          <h1 className="mt-1 text-3xl font-black leading-tight text-slate-950">Cierre de turno</h1>
          <p className="mt-1 text-base font-bold text-slate-600">Resumen y cierre del turno actual</p>

          <div
            className={`mt-5 grid gap-3 ${isAccessible ? "sm:grid-cols-2" : "sm:flex sm:flex-wrap"}`}
            aria-label="Acciones de cierre"
          >
            <button
              type="button"
              onClick={onPrint}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-800 transition hover:bg-slate-100 ${buttonSizeClass} ${FOCUS_VISIBLE_CLASS}`}
            >
              <Printer className="h-5 w-5" aria-hidden="true" />
              Imprimir resumen
            </button>

            {isTurnoOpen ? (
              <button
                type="button"
                onClick={onCerrarTurno}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-800 bg-red-700 px-5 font-black text-white transition hover:bg-red-800 ${buttonSizeClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                Cerrar turno
              </button>
            ) : (
              <button
                type="button"
                onClick={onAbrirTurno}
                className={`inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-600 px-5 font-black text-white transition hover:bg-emerald-700 ${buttonSizeClass} ${FOCUS_VISIBLE_CLASS}`}
              >
                <Store className="h-5 w-5" aria-hidden="true" />
                Abrir turno
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          <HeaderInfo
            icon={<Store className="h-5 w-5" aria-hidden="true" />}
            label={responsable.primaryLabel}
            value={responsable.primaryValue}
          />
          {responsable.roleValue && (
            <HeaderInfo
              icon={<Store className="h-5 w-5" aria-hidden="true" />}
              label="Rol"
              value={responsable.roleValue}
            />
          )}
          <HeaderInfo
            icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
            label="Fecha"
            value={formatDateOnly(now)}
          />
          <HeaderInfo
            icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
            label="Inicio del turno"
            value={fechaInicio ? formatDateTime(fechaInicio) : "Sin datos"}
          />
          <HeaderInfo
            icon={<Clock3 className="h-5 w-5" aria-hidden="true" />}
            label="Hora actual"
            value={formatTime(now.toISOString())}
          />
          <HeaderInfo
            icon={<FileText className="h-5 w-5" aria-hidden="true" />}
            label="Estado del turno"
            value={isTurnoOpen ? "Abierto" : "Cerrado"}
          />
        </div>
      </div>
    </header>
  );
}

function formatDateOnly(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "full"
  }).format(value);
}

function HeaderInfo({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </article>
  );
}

function EasyDisclosure({
  children,
  isExpanded,
  onToggle,
  title
}: {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <section className="rounded-[24px] border-2 border-slate-900 bg-white p-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`flex min-h-[64px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-300 bg-white px-5 text-left text-xl font-black text-slate-950 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
      >
        <span>{title}</span>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
      {isExpanded && <div className="mt-4">{children}</div>}
    </section>
  );
}

function MetricCard({
  helpText,
  label,
  value,
  variant = "default"
}: {
  helpText?: string;
  label: string;
  value: string;
  variant?: "default" | "strong";
}) {
  return (
    <article
      className={`rounded-[18px] border p-4 ${variant === "strong" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
    >
      <p className="text-sm font-black uppercase text-slate-500">{label}</p>
      <p className={`mt-2 font-black text-slate-950 ${variant === "strong" ? "text-3xl" : "text-2xl"}`}>{value}</p>
      {helpText && <p className="mt-2 text-sm font-bold text-emerald-800">{helpText}</p>}
    </article>
  );
}

function PaymentMethodsPanel({
  panelClass,
  summary
}: {
  panelClass: string;
  summary: ReturnType<typeof getTurnoSummary>;
}) {
  const methods = [
    { icon: <Banknote className="h-5 w-5" aria-hidden="true" />, label: "Efectivo", value: summary.totalEfectivo },
    { icon: <CreditCard className="h-5 w-5" aria-hidden="true" />, label: "Tarjeta", value: summary.totalTarjeta },
    {
      icon: <WalletCards className="h-5 w-5" aria-hidden="true" />,
      label: "Transferencia",
      value: summary.totalTransferencia
    }
  ];

  return (
    <section className={`rounded-[18px] p-4 ${panelClass}`} aria-labelledby="metodos-pago-title">
      <h2 id="metodos-pago-title" className="text-xl font-black text-slate-950">
        Métodos de pago
      </h2>
      <div className="mt-4 grid gap-3">
        {methods.map((method) => (
          <article
            key={method.label}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <p className="flex items-center gap-2 font-black text-slate-800">
              {method.icon}
              {method.label}
            </p>
            <p className="text-lg font-black text-slate-950">{formatCurrency(String(method.value))}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductosVendidosPanel({
  panelClass,
  productosVendidos
}: {
  panelClass: string;
  productosVendidos: CierreProductoResumen[];
}) {
  const totalUnidades = productosVendidos.reduce((total, producto) => total + producto.cantidad, 0);

  return (
    <section className={`rounded-[18px] p-4 ${panelClass}`} aria-labelledby="productos-vendidos-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="productos-vendidos-title" className="text-xl font-black text-slate-950">
            Productos vendidos
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-600">Resumen por producto entregado.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {totalUnidades} unidades
        </span>
      </div>

      {productosVendidos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-600">
          No hay productos vendidos en pedidos entregados.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          {productosVendidos.map((producto) => (
            <article
              key={producto.productoId}
              className="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_110px_140px] sm:items-center"
            >
              <p className="font-black text-slate-950">{producto.productoNombre}</p>
              <p className="font-bold text-slate-700">{producto.cantidad} vendidos</p>
              <p className="font-black text-slate-950 sm:text-right">{formatCurrency(String(producto.total))}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PedidosTurnoPanel({
  panelClass,
  pedidos
}: {
  panelClass: string;
  pedidos: ReturnType<typeof getCierrePedidosResumen>;
}) {
  return (
    <section className={`rounded-[18px] p-4 ${panelClass}`} aria-labelledby="pedidos-turno-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="pedidos-turno-title" className="text-xl font-black text-slate-950">
            Pedidos del turno
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
          {pedidos.length} pedidos
        </span>
      </div>

      {pedidos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-600">
          No hay pedidos registrados para el turno actual.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-500 md:grid md:grid-cols-[120px_170px_160px_130px_100px]">
            <span>Pedido</span>
            <span>Estado</span>
            <span>Método de pago</span>
            <span>Total</span>
            <span>Hora</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[120px_170px_160px_130px_100px] md:items-center"
              >
                <p className="font-black text-slate-950">#{getPedidoDisplayNumber(pedido)}</p>
                <StatusBadge estado={pedido.estado} />
                <p className="font-bold text-slate-700">{formatMetodoPago(pedido.metodoPago)}</p>
                <p className="font-black text-slate-950">{formatCurrency(String(pedido.total))}</p>
                <p className="font-bold text-slate-600">{formatTime(pedido.createdAt)}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CerrarTurnoModal({
  hasPedidosPendientes,
  isSaving,
  onClose,
  onConfirm,
  onReviewPedidos
}: {
  hasPedidosPendientes: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReviewPedidos: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cerrar-turno-title"
        className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cerrar-turno-title" className="text-2xl font-black text-slate-950">
              ¿Deseas cerrar el turno?
            </h2>
          </div>
          <button
            type="button"
            onClick={hasPedidosPendientes ? onReviewPedidos : onClose}
            aria-label="Cancelar cierre de turno"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {hasPedidosPendientes && (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-[#FFF8DC] p-4 text-yellow-950"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="font-black">Hay pedidos pendientes. Puedes revisarlos antes de cerrar.</p>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[52px] rounded-xl border border-slate-300 bg-white px-4 font-black text-slate-700 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
          >
            Revisar pedidos
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`min-h-[52px] rounded-xl border border-red-800 bg-red-700 px-4 font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
          >
            {isSaving ? "Guardando..." : "Cerrar turno"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CierreTurnoPage;
