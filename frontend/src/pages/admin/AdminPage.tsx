import { Check, Plus, Save, Search, Users, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import ErrorAlert from "../../components/ErrorAlert";
import AlertMessage from "../../components/ui/AlertMessage";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { cargarCierresTurno } from "../../services/cierresTurno";
import { getInventario } from "../../services/inventario";
import { getPedidos } from "../../services/pedidos";
import { getProductos } from "../../services/productos";
import { createUsuario, getUsuarios, updateUsuario } from "../../services/usuarios";
import type { AdminUser, CreateUserPayload, InventarioItem, PedidoResponse, Producto, UserRole } from "../../types";
import { formatCurrency } from "../../utils/pdv";

type AdminPageMode = "dashboard" | "usuarios";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  cajero: "Cajero",
  cocina: "Cocina"
};

const ROLE_PERMISSIONS: Array<{ role: UserRole; permissions: Record<string, boolean> }> = [
  {
    role: "admin",
    permissions: {
      Pedidos: true,
      Productos: true,
      Inventario: true,
      Ventas: true,
      Usuarios: true,
      Cocina: true,
      Reportes: true
    }
  },
  {
    role: "cajero",
    permissions: {
      Pedidos: true,
      Productos: true,
      Inventario: true,
      Ventas: true,
      Usuarios: false,
      Cocina: true,
      Reportes: true
    }
  },
  {
    role: "cocina",
    permissions: {
      Pedidos: false,
      Productos: false,
      Inventario: false,
      Ventas: false,
      Usuarios: false,
      Cocina: true,
      Reportes: false
    }
  }
];

const PERMISSION_COLUMNS = ["Pedidos", "Productos", "Inventario", "Ventas", "Usuarios", "Cocina", "Reportes"];

function statusClass(active: boolean) {
  return active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-100 text-slate-700";
}

function roleClass(role: UserRole) {
  if (role === "admin") return "border-slate-300 bg-slate-100 text-slate-800";
  if (role === "cocina") return "border-yellow-200 bg-[#FFF8DC] text-yellow-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function AdminPage({ mode = "dashboard" }: { mode?: AdminPageMode }) {
  if (mode === "usuarios") return <AdminUsersPage />;
  return <AdminDashboardPage />;
}

function AdminShell({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  return (
    <main className="mx-auto w-full max-w-[1640px] space-y-4 px-3 py-4 sm:px-4 lg:px-5 xl:px-6 2xl:max-w-[1800px]">
      <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-slate-500">Administración</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">{description}</p>
          </div>
          <span className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full border border-yellow-300 bg-[#FECE00] px-3 text-xs font-black text-slate-950">
            Rol admin
          </span>
        </div>
      </section>
      {children}
    </main>
  );
}

function AdminDashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoResponse[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [totalVendido, setTotalVendido] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getPedidos(),
      getProductos({ includeUnavailable: true }),
      getInventario(),
      getUsuarios(),
      cargarCierresTurno()
    ])
      .then(([pedidosData, productosData, inventarioData, usuariosData, cierres]) => {
        setPedidos(pedidosData);
        setProductos(productosData);
        setInventario(inventarioData);
        setUsuarios(usuariosData);
        setTotalVendido(
          cierres[0]?.totalVendido ?? pedidosData.reduce((total, pedido) => total + Number(pedido.total), 0)
        );
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "No se pudo cargar el dashboard")
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const disponibles = productos.filter((producto) => producto.disponible !== false).length;
  const stockCritico = inventario.filter((item) => item.estado === "bajo_stock" || item.estado === "sin_stock");
  const activos = usuarios.filter((usuario) => usuario.activo).length;
  const pedidosPendientes = pedidos.filter((pedido) => pedido.estado === "pendiente").length;
  const lastUpdated = new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date());

  return (
    <AdminShell title="Dashboard Admin" description="Resumen general del sistema y estado operativo del local.">
      {error && <ErrorAlert message={error} />}
      {isLoading ? (
        <LoadingState label="Cargando panel admin..." />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <article className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-500">Trabajo pendiente</p>
                  <h2 className="text-base font-black text-slate-950">Pendientes administrativos</h2>
                </div>
              </header>
              <div className="divide-y divide-slate-100">
                <PendingRow
                  badge="Historial"
                  description="Consultar ventas y pedidos del último cierre disponible"
                  path="/admin/reportes"
                  title="Ver historial del último turno"
                  tone="neutral"
                />
                <PendingRow
                  badge={`${disponibles}/${productos.length}`}
                  description="Confirmar productos visibles para venta"
                  path="/admin/productos"
                  title="Revisar productos disponibles"
                  tone="neutral"
                />
                <PendingRow
                  badge={`${activos} activos`}
                  description="Mantener roles y accesos actualizados"
                  path="/admin/usuarios"
                  title="Gestionar usuarios activos"
                  tone="neutral"
                />
              </div>
            </article>

            <article className="rounded-[10px] border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-100 px-4 py-3">
                <p className="text-[11px] font-black uppercase text-slate-500">Local</p>
                <h2 className="text-base font-black text-slate-950">Estado del sistema</h2>
              </header>
              <div className="divide-y divide-slate-100">
                <DashboardLine
                  label="Último turno cerrado"
                  value={totalVendido > 0 ? formatCurrency(totalVendido) : "Sin cierre confirmado"}
                />
                <DashboardLine label="Total vendido confirmado" value={formatCurrency(totalVendido)} />
                <DashboardLine label="Pedidos pendientes" value={pedidosPendientes} />
                <DashboardLine label="Productos disponibles" value={`${disponibles} de ${productos.length}`} />
                <DashboardLine label="Última actualización" value={lastUpdated} />
              </div>
            </article>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
            <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-[11px] font-black uppercase text-slate-500">Inventario</p>
                <h2 className="text-base font-black text-slate-950">Productos con bajo stock</h2>
              </div>
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-black text-slate-700">
                {stockCritico.length}
              </span>
            </header>
            {stockCritico.length === 0 ? (
              <div className="px-4 py-6 text-sm font-bold text-slate-600">
                Todos los productos están dentro del stock esperado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {stockCritico.map((item) => (
                  <StockRiskRow key={item.productoId} item={item} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

function getEstadoClass(estado: InventarioItem["estado"]) {
  if (estado === "sin_stock") return "border-red-200 bg-red-50 text-red-800";
  if (estado === "bajo_stock") return "border-yellow-200 bg-[#FFF8DC] text-yellow-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function StockRiskRow({ item }: { item: InventarioItem }) {
  return (
    <article className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1fr)_120px_120px_120px_130px] lg:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{item.productoNombre}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">Producto con stock por revisar</p>
      </div>
      <p className="text-sm font-black text-slate-700">Stock {item.stockActual}</p>
      <p className="text-sm font-black text-slate-700">Mínimo {item.stockMinimo}</p>
      <span
        className={`inline-flex min-h-[32px] items-center justify-center rounded-full border px-3 text-xs font-black ${getEstadoClass(item.estado)}`}
      >
        {getEstadoLabel(item.estado)}
      </span>
      <Link
        to="/admin/inventario"
        className={`inline-flex min-h-[36px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-black ${FOCUS_VISIBLE_CLASS}`}
      >
        Revisar
      </Link>
    </article>
  );
}

function getEstadoLabel(estado: InventarioItem["estado"]) {
  if (estado === "sin_stock") return "Sin stock";
  if (estado === "bajo_stock") return "Bajo stock";
  return "Disponible";
}

function PendingRow({
  badge,
  description,
  path,
  title,
  tone
}: {
  badge: string;
  description: string;
  path: string;
  title: string;
  tone: "neutral" | "success" | "warning";
}) {
  const badgeClass =
    tone === "warning"
      ? "border-yellow-200 bg-[#FFF8DC] text-yellow-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-950">{title}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-500">{description}</p>
      </div>
      <span
        className={`inline-flex min-h-[30px] items-center justify-center rounded-full border px-3 text-xs font-black ${badgeClass}`}
      >
        {badge}
      </span>
      <Link
        to={path}
        className={`inline-flex min-h-[34px] items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
      >
        Revisar
      </Link>
    </div>
  );
}

function DashboardLine({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex min-h-[54px] items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="text-right text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function AdminUsersPage() {
  const emptyUser: CreateUserPayload = {
    email: "",
    label: "",
    password: "",
    role: "cajero",
    username: "",
    activo: true
  };
  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [draft, setDraft] = useState<CreateUserPayload>(emptyUser);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError(null);
    getUsuarios()
      .then(setUsuarios)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar usuarios")
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (usuario: AdminUser) => {
    setEditing(usuario);
    setDraft({
      activo: usuario.activo,
      email: usuario.email,
      label: usuario.label,
      password: "",
      role: usuario.role,
      username: usuario.username
    });
    setPassword("");
    setIsUserModalOpen(true);
  };

  const startCreate = () => {
    setEditing(null);
    setDraft(emptyUser);
    setPassword("");
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditing(null);
    setDraft(emptyUser);
    setPassword("");
  };

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      setSavingId(editing?.id ?? "new");
      const saved = editing
        ? await updateUsuario(editing.id, { ...draft, ...(password ? { password } : {}) })
        : await createUsuario(draft);
      setUsuarios((current) =>
        editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      );
      setDraft(emptyUser);
      setEditing(null);
      setPassword("");
      setIsUserModalOpen(false);
      setMessage("Usuario guardado correctamente.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo guardar usuario");
    } finally {
      setSavingId(null);
    }
  };

  const toggleUser = async (usuario: AdminUser) => {
    const confirmed = window.confirm(`¿${usuario.activo ? "Desactivar" : "Activar"} el usuario "${usuario.label}"?`);

    if (!confirmed) return;

    setSavingId(usuario.id);
    setError(null);
    try {
      const saved = await updateUsuario(usuario.id, { activo: !usuario.activo });
      setUsuarios((current) => current.map((item) => (item.id === saved.id ? saved : item)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cambiar estado");
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    return [usuario.label, usuario.username, usuario.email, usuario.role].some((value) =>
      value.toLowerCase().includes(search)
    );
  });

  const totalActivos = usuarios.filter((usuario) => usuario.activo).length;
  const totalInactivos = usuarios.length - totalActivos;

  return (
    <AdminShell
      title="Gestionar mi equipo"
      description="Revisa los permisos por rol y administra los usuarios creados del sistema."
    >
      {message && <AlertMessage message={message} tone="success" />}
      {error && <ErrorAlert message={error} />}
      <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
        <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-slate-100 px-4">
          <div>
            <p className="text-[11px] font-black uppercase text-slate-500">Saber más de los roles</p>
            <h2 className="text-base font-black text-slate-950">Permisos por rol</h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
            3 roles
          </span>
        </header>
        <div className="overflow-x-auto px-4 py-3">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-black uppercase text-slate-500">
                <th className="px-3 py-3">Nombre</th>
                {PERMISSION_COLUMNS.map((column) => (
                  <th key={column} className="px-3 py-3 text-center">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_PERMISSIONS.map((row) => (
                <tr key={row.role} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-3 py-4 font-black text-slate-950">{ROLE_LABELS[row.role]}</td>
                  {PERMISSION_COLUMNS.map((column) => (
                    <td key={column} className="px-3 py-4 text-center">
                      {row.permissions[column] ? (
                        <Check className="mx-auto h-5 w-5 text-emerald-700" aria-label="Permitido" />
                      ) : (
                        <Check className="mx-auto h-5 w-5 text-slate-200" aria-label="Sin permiso" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm">
        <header className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[minmax(0,1fr)_280px_auto] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase text-slate-500">Usuarios creados</p>
            <h2 className="text-base font-black text-slate-950">
              {usuarios.length} usuarios · {totalActivos} activos · {totalInactivos} inactivos
            </h2>
          </div>
          <label className="relative block">
            <span className="sr-only">Buscar usuario</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar usuario"
              className={`min-h-[42px] w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-bold text-slate-950 ${FOCUS_VISIBLE_CLASS}`}
            />
          </label>
          <button
            type="button"
            onClick={startCreate}
            className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 ${FOCUS_VISIBLE_CLASS}`}
          >
            <Plus className="h-4 w-4" /> Agregar usuario
          </button>
        </header>
        {isLoading ? (
          <LoadingState label="Cargando usuarios..." />
        ) : usuarios.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay usuarios registrados"
            message="Agrega el primer usuario del sistema."
          />
        ) : filteredUsuarios.length === 0 ? (
          <EmptyState icon={Search} title="Sin resultados" message="Prueba con otro nombre, email o rol." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo electrónico</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-4 font-black text-slate-950">{usuario.label}</td>
                    <td className="px-4 py-4 font-bold text-slate-600">{usuario.email}</td>
                    <td className="px-4 py-4 font-mono text-sm font-bold text-slate-700">{usuario.username}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex min-h-[32px] items-center justify-center rounded-full border px-3 text-xs font-black ${roleClass(usuario.role)}`}
                      >
                        {ROLE_LABELS[usuario.role]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex min-h-[32px] items-center justify-center rounded-full border px-3 text-xs font-black ${statusClass(usuario.activo)}`}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(usuario)}
                          className={`min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm font-black ${FOCUS_VISIBLE_CLASS}`}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={savingId === usuario.id}
                          onClick={() => toggleUser(usuario)}
                          className={`min-h-[38px] rounded-lg border border-slate-900 bg-slate-900 px-3 text-sm font-black text-white ${FOCUS_VISIBLE_CLASS}`}
                        >
                          {usuario.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isUserModalOpen && (
        <UserFormModal
          draft={draft}
          editing={editing}
          isSaving={savingId !== null}
          onClose={closeUserModal}
          onDraftChange={setDraft}
          onPasswordChange={setPassword}
          onSubmit={saveUser}
          password={password}
        />
      )}
    </AdminShell>
  );
}

function AdminInput({
  label,
  onChange,
  required = true,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-500">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-[44px] w-full rounded-xl border border-slate-300 px-3 font-bold text-slate-950 ${FOCUS_VISIBLE_CLASS}`}
      />
    </label>
  );
}

function UserFormModal({
  draft,
  editing,
  isSaving,
  onClose,
  onDraftChange,
  onPasswordChange,
  onSubmit,
  password
}: {
  draft: CreateUserPayload;
  editing: AdminUser | null;
  isSaving: boolean;
  onClose: () => void;
  onDraftChange: (draft: CreateUserPayload) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-2xl"
        aria-label={editing ? "Editar usuario" : "Crear usuario"}
      >
        <header className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-200 px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-slate-500">Equipo y roles</p>
            <h2 className="truncate text-xl font-black text-slate-950">
              {editing ? "Editar usuario" : "Crear usuario"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto bg-slate-50 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-black text-slate-700">Rol</span>
            <select
              value={draft.role}
              onChange={(event) => onDraftChange({ ...draft, role: event.target.value as UserRole })}
              className={`min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3 font-bold text-slate-950 ${FOCUS_VISIBLE_CLASS}`}
            >
              <option value="cajero">Cajero</option>
              <option value="cocina">Cocina</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <AdminInput
            label="Nombre"
            value={draft.label}
            onChange={(value) => onDraftChange({ ...draft, label: value })}
          />
          <AdminInput
            label="Nombre de usuario"
            value={draft.username}
            onChange={(value) => onDraftChange({ ...draft, username: value })}
          />
          <AdminInput
            label="Correo electrónico"
            type="email"
            value={draft.email}
            onChange={(value) => onDraftChange({ ...draft, email: value })}
          />
          <AdminInput
            label={editing ? "Nueva contraseña" : "Contraseña"}
            type="password"
            value={editing ? password : draft.password}
            onChange={(value) => (editing ? onPasswordChange(value) : onDraftChange({ ...draft, password: value }))}
            required={!editing}
          />
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-[44px] flex-1 rounded-xl border border-slate-300 px-4 font-black text-slate-700 transition hover:bg-slate-50 ${FOCUS_VISIBLE_CLASS}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </form>
    </div>
  );
}
