import { Check, Plus, Save, Search, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import ErrorAlert from "../../components/ErrorAlert";
import AlertMessage from "../../components/ui/AlertMessage";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import { FOCUS_VISIBLE_CLASS } from "../../constants/ui";
import { useAccessibilityContext } from "../../contexts/AccessibilityContext";
import { useSoundFeedback } from "../../hooks/useSoundFeedback";
import useAccessibleDialog from "../../hooks/useAccessibleDialog";
import useVoice from "../../hooks/useVoice";
import { createUsuario, getUsuarios, updateUsuario } from "../../services/usuarios";
import type { AdminUser, CreateUserPayload, UserRole } from "../../types";
import AdminDashboard from "./AdminDashboard";

type AdminPageMode = "dashboard" | "usuarios";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  cajero: "Cajero",
  cocina: "Cocina"
};

export const ROLE_PERMISSIONS: Array<{
  role: UserRole;
  permissions: Record<string, boolean>;
}> = [
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
      Reportes: false
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
            <h1 className="text-2xl font-black text-slate-950">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">{description}</p>
          </div>
        </div>
      </section>
      {children}
    </main>
  );
}

function AdminDashboardPage() {
  return (
    <AdminShell title="Resumen" description="Ventas y estado operativo del local.">
      <AdminDashboard />
    </AdminShell>
  );
}

function AdminUsersPage() {
  const { isSoundEnabled, isVoiceEnabled, soundVolume } = useAccessibilityContext();
  const soundFeedback = useSoundFeedback(isSoundEnabled, soundVolume);
  const { speak } = useVoice({ enabled: isVoiceEnabled });
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
  const savingRef = useRef(false);

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
    setError(null);
    setMessage(null);
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
    setError(null);
    setMessage(null);
    setEditing(null);
    setDraft(emptyUser);
    setPassword("");
    setIsUserModalOpen(true);
  };

  const closeUserModal = useCallback(() => {
    if (savingRef.current) return;
    setIsUserModalOpen(false);
    setEditing(null);
    setDraft({
      email: "",
      label: "",
      password: "",
      role: "cajero",
      username: "",
      activo: true
    });
    setPassword("");
  }, []);

  const saveUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setError(null);
    setMessage(null);
    const isEditing = Boolean(editing);
    try {
      setSavingId(editing?.id ?? "new");
      const saved = editing
        ? await updateUsuario(editing.id, {
            ...draft,
            ...(password ? { password } : {})
          })
        : await createUsuario(draft);
      setUsuarios((current) =>
        editing ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      );
      setDraft(emptyUser);
      setEditing(null);
      setPassword("");
      setIsUserModalOpen(false);
      const successMessage = isEditing ? "Usuario actualizado correctamente." : "Usuario creado correctamente.";
      setMessage(successMessage);
      soundFeedback.success();
      void speak(successMessage, {
        priority: "high",
        dedupeKey: isEditing ? "admin-user-updated" : "admin-user-created",
        cooldownMs: 2200,
        interrupt: true
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo guardar usuario");
      soundFeedback.error();
      void speak("No se pudo guardar el usuario.", {
        priority: "high",
        dedupeKey: "admin-user-save-error",
        cooldownMs: 2200,
        interrupt: true
      });
    } finally {
      savingRef.current = false;
      setSavingId(null);
    }
  };

  const toggleUser = async (usuario: AdminUser) => {
    const confirmed = window.confirm(`¿${usuario.activo ? "Desactivar" : "Activar"} el usuario "${usuario.label}"?`);

    if (!confirmed) return;

    setSavingId(usuario.id);
    setError(null);
    setMessage(null);
    try {
      const saved = await updateUsuario(usuario.id, {
        activo: !usuario.activo
      });
      setUsuarios((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      const successMessage = saved.activo ? "Usuario activado correctamente." : "Usuario desactivado correctamente.";
      setMessage(successMessage);
      soundFeedback.success();
      void speak(successMessage, {
        priority: "high",
        dedupeKey: saved.activo ? `admin-user-activated:${saved.id}` : `admin-user-deactivated:${saved.id}`,
        cooldownMs: 2200,
        interrupt: true
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cambiar estado");
      soundFeedback.error();
      void speak("No se pudo cambiar el estado del usuario.", {
        priority: "high",
        dedupeKey: "admin-user-status-error",
        cooldownMs: 2200,
        interrupt: true
      });
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
      {error && !isUserModalOpen && <ErrorAlert message={error} />}
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
        <div className="overflow-x-auto px-4 py-3" tabIndex={0} aria-label="Tabla de permisos desplazable">
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
          error={error}
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
  minLength,
  onChange,
  required = true,
  type = "text",
  value
}: {
  label: string;
  minLength?: number;
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
        minLength={minLength}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`admin-form-input min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 font-bold text-slate-950 ${FOCUS_VISIBLE_CLASS}`}
      />
    </label>
  );
}

function UserFormModal({
  draft,
  editing,
  error,
  isSaving,
  onClose,
  onDraftChange,
  onPasswordChange,
  onSubmit,
  password
}: {
  draft: CreateUserPayload;
  editing: AdminUser | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onDraftChange: (draft: CreateUserPayload) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
}) {
  const dialogRef = useRef<HTMLFormElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isSavingRef = useRef(isSaving);
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);
  const handleDialogClose = useCallback(() => {
    if (!isSavingRef.current) onClose();
  }, [onClose]);
  useAccessibleDialog({
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    onClose: handleDialogClose
  });

  return (
    <div className="fixed inset-0 z-[120] !mt-0 flex items-center justify-center overflow-y-auto bg-black/40 p-3 backdrop-blur-[1px]">
      <form
        ref={dialogRef}
        onSubmit={onSubmit}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        aria-busy={isSaving}
        tabIndex={-1}
      >
        <header className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-200 px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase text-slate-500">Equipo y roles</p>
            <h2 id="user-form-title" className="truncate text-xl font-black text-slate-950">
              {editing ? "Editar usuario" : "Crear usuario"}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-950 transition hover:bg-slate-100 ${FOCUS_VISIBLE_CLASS}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto bg-slate-50 p-5">
          {error && <ErrorAlert message={error} />}
          <label className="block">
            <span className="mb-1 block text-sm font-black text-slate-700">Rol</span>
            <select
              value={draft.role}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  role: event.target.value as UserRole
                })
              }
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
            minLength={8}
            value={editing ? password : draft.password}
            onChange={(value) => (editing ? onPasswordChange(value) : onDraftChange({ ...draft, password: value }))}
            required={!editing}
          />
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={`min-h-[44px] flex-1 rounded-xl border border-slate-300 px-4 font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_VISIBLE_CLASS}`}
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
