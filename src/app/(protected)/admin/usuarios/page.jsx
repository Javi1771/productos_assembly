"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Loader2, Search, X, ShieldCheck, UserCircle2, LogOut, 
  ChevronLeft, Edit3, BadgeCheck, RefreshCw, Trash2, Key, Info, CheckCircle, 
  AlertTriangle, Crown, Award, Wrench, } from "lucide-react";
import GlobalTopbar from "@/components/GlobalTopbar";
import { useAlert } from "@/components/AlertSystem";
import UserFormModal from "@/components/UserFormModal";

//* ---- helpers cookies ----
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
function getUserRoleFromCookie() {
  const raw = getCookie("u_rol");
  return raw ? String(raw).trim() : null;
}

const ROLE_OPTIONS = [
  {
    value: 1,
    label: "Administrador",
    icon: Crown,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    value: 2,
    label: "Calidad",
    icon: Award,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    value: 3,
    label: "Operador",
    icon: Wrench,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
];

function getRoleConfig(v) {
  return (
    ROLE_OPTIONS.find((r) => String(r.value) === String(v)) || ROLE_OPTIONS[2]
  );
}

export default function UsersAdminPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useAlert();

  //! evitar hydration issues + gate por rol
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setMounted(true);
    setIsAdmin(getUserRoleFromCookie() === "1");
  }, []);

  //* listado y filtros
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  //* paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  //* modal state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  //* carga de usuarios
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/users", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d?.ok)
        throw new Error(d?.error || "No se pudo cargar usuarios");
      setUsers(Array.isArray(d.users) ? d.users : []);
    } catch (e) {
      showError(e.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (mounted && isAdmin) load();
  }, [mounted, isAdmin]);

  //! eliminar usuario
  async function removeUser(u) {
    const roleLabel = getRoleConfig(u.rol)?.label || "—";
    const confirmed = await showDeleteModal(u, roleLabel);
    if (!confirmed) return;

    try {
      const qs = new URLSearchParams();
      if (u.source) qs.set("source", u.source);
      const r = await fetch(
        `/api/admin/users/${encodeURIComponent(u.id)}?${qs.toString()}`,
        { method: "DELETE" }
      );
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo eliminar");
      showSuccess("Registro eliminado");
      await load();
    } catch (e) {
      showError(e.message || "Error al eliminar");
    }
  }

  //* lista filtrada
  const filteredUsers = useMemo(() => {
    const text = q.trim().toLowerCase();
    return users.filter((u) => {
      const passText =
        !text ||
        String(u.correo || "")
          .toLowerCase()
          .includes(text) ||
        String(u.nombre || "")
          .toLowerCase()
          .includes(text) ||
        String(u.apellido || "")
          .toLowerCase()
          .includes(text) ||
        String(u.nomina || "")
          .toLowerCase()
          .includes(text) ||
        String(u.rfid || "")
          .toLowerCase()
          .includes(text) ||
        String(u.id || "")
          .toLowerCase()
          .includes(text);

      const passRole =
        roleFilter === "all" || String(u.rol) === String(roleFilter);
      const passSource = sourceFilter === "all" || u.source === sourceFilter;

      return passText && passRole && passSource;
    });
  }, [users, q, roleFilter, sourceFilter]);

  //! resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [q, roleFilter, sourceFilter]);

  //* calcular datos paginados y totales
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1 && totalPages >= 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  //* abrir formularios
  function openCreate() {
    setEditingUser(null);
    setShowForm(true);
  }
  function openEdit(u) {
    setEditingUser(u);
    setShowForm(true);
  }

  //* manejar submit del formulario
  async function handleFormSubmit(payload, userId, userSource) {
    try {
      setSaving(true);
      let r, d;

      if (userId) {
        //? UPDATE
        const qs = new URLSearchParams();
        if (userSource) qs.set("source", userSource);
        r = await fetch(
          `/api/admin/users/${encodeURIComponent(userId)}?${qs.toString()}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        //? CREATE
        r = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar");

      showSuccess(userId ? "Usuario actualizado" : "Usuario creado");
      setShowForm(false);
      setEditingUser(null);
      await load();
    } catch (e) {
      showError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  //* resetear contraseña con modal personalizado
  async function resetPassword(u) {
    const showPasswordModal = () => {
      return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className =
          "fixed inset-0 z-50 flex items-center justify-center p-4";
        overlay.innerHTML = `
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
            <div class="relative p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
              <div class="absolute inset-0 bg-black/10"></div>
              <div class="relative flex items-center gap-3">
                <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Key class="w-6 h-6" />
                </div>
                <div>
                  <h3 class="text-xl font-bold">Resetear Contraseña</h3>
                  <p class="text-white/90 text-sm">Cambiar contraseña del usuario</p>
                </div>
              </div>
            </div>
            <div class="p-6 space-y-4">
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  Usuario: <span class="font-mono text-indigo-600 dark:text-indigo-400">${
                    u.correo || u.nombre || "Sin identificar"
                  }</span>
                </label>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div class="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
                  Nueva Contraseña
                </label>
                <input 
                  type="password" 
                  id="newPassword"
                  placeholder="Ingresa la nueva contraseña"
                  class="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                         text-slate-900 dark:text-slate-100 placeholder-slate-400
                         border-slate-200 dark:border-slate-700
                         focus:outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500
                         transition-all duration-200"
                />
              </div>
              <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button 
                  id="cancelBtn"
                  class="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         hover:bg-slate-50 dark:hover:bg-slate-700
                         transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button 
                  id="confirmBtn"
                  class="inline-flex items-center gap-3 px-8 py-3 rounded-xl
                         bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white
                         hover:from-amber-500 hover:via-orange-500 hover:to-red-500
                         transform hover:scale-105 transition-all duration-200
                         shadow-lg hover:shadow-xl font-semibold"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector("#newPassword");
        const cancelBtn = overlay.querySelector("#cancelBtn");
        const confirmBtn = overlay.querySelector("#confirmBtn");

        input.focus();

        const cleanup = () => {
          document.body.removeChild(overlay);
        };

        cancelBtn.onclick = () => {
          cleanup();
          resolve(null);
        };

        confirmBtn.onclick = () => {
          const password = input.value.trim();
          cleanup();
          resolve(password || null);
        };

        input.onkeydown = (e) => {
          if (e.key === "Enter") {
            const password = input.value.trim();
            cleanup();
            resolve(password || null);
          } else if (e.key === "Escape") {
            cleanup();
            resolve(null);
          }
        };

        overlay.onclick = (e) => {
          if (e.target === overlay) {
            cleanup();
            resolve(null);
          }
        };
      });
    };

    try {
      const newPassword = await showPasswordModal();
      if (!newPassword) return;

      const qs = new URLSearchParams();
      if (u.source) qs.set("source", u.source);
      const r = await fetch(
        `/api/admin/users/${encodeURIComponent(u.id)}?${qs.toString()}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        }
      );
      const d = await r.json();
      if (!r.ok || !d?.ok)
        throw new Error(d?.error || "No se pudo actualizar contraseña");
      showSuccess("Contraseña actualizada correctamente");
    } catch (e) {
      showError(e.message || "Error al actualizar contraseña");
    }
  }

  //* Modal de confirmación de eliminación (estilo similar al de reset password)
  function showDeleteModal(u, roleLabel) {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 z-50 flex items-center justify-center p-4";
      overlay.innerHTML = `
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
        <!-- Header -->
        <div class="relative p-6 bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white">
          <div class="absolute inset-0 bg-black/10"></div>
          <div class="relative flex items-center gap-3">
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <!-- Trash icon (inline SVG) -->
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m1 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 4v8m6-8v8"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold">Eliminar usuario</h3>
              <p class="text-white/90 text-sm">Esta acción es permanente</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <div class="rounded-xl border border-rose-200/60 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 px-3 py-2 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2">
            <svg class="w-4 h-4 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07L13.41 4.93a2 2 0 00-3.42 0L3 17.07A2 2 0 005.07 19z"/>
            </svg>
            <div>
              <p class="font-semibold">¿Seguro que quieres eliminar este registro?</p>
              <p class="opacity-90">Se eliminará de la tabla <b>${
                u.source === "operadores" ? "Operadores" : "Usuarios"
              }</b> y no podrás deshacerlo.</p>
            </div>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-slate-600 dark:text-slate-300">Usuario</span>
              <span class="font-mono text-indigo-600 dark:text-indigo-400">${
                u.correo ||
                (u.nombre
                  ? u.nombre + " " + (u.apellido || "")
                  : u.nomina || u.id || "—")
              }</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600 dark:text-slate-300">Rol</span>
              <span class="text-slate-900 dark:text-slate-100 font-medium">${
                roleLabel || "—"
              }</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-600 dark:text-slate-300">Origen</span>
              <span class="text-slate-900 dark:text-slate-100 font-medium">${
                u.source === "operadores" ? "Operadores" : "Usuarios"
              }</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <div class="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-red-500"></div>
              Para confirmar, escribe <span class="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">ELIMINAR</span>
            </label>
            <input 
              type="text" 
              id="confirmText"
              placeholder="Escribe 'ELIMINAR'"
              class="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                     text-slate-900 dark:text-slate-100 placeholder-slate-400
                     border-slate-200 dark:border-slate-700
                     focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500
                     transition-all duration-200 uppercase"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button 
              id="cancelBtn"
              class="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 
                     bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                     hover:bg-slate-50 dark:hover:bg-slate-700
                     transition-all duration-200 font-semibold"
            >
              Cancelar
            </button>
            <button 
              id="confirmBtn"
              disabled
              class="inline-flex items-center gap-3 px-8 py-3 rounded-xl
                     bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 text-white
                     hover:from-rose-500 hover:via-red-500 hover:to-orange-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-105 transition-all duration-200
                     shadow-lg hover:shadow-xl font-semibold"
            >
              Eliminar definitivamente
            </button>
          </div>
        </div>
      </div>
    `;

      document.body.appendChild(overlay);

      const input = overlay.querySelector("#confirmText");
      const cancelBtn = overlay.querySelector("#cancelBtn");
      const confirmBtn = overlay.querySelector("#confirmBtn");

      const enableCheck = () => {
        confirmBtn.disabled = input.value.trim().toUpperCase() !== "ELIMINAR";
      };

      const cleanup = () => {
        if (overlay.parentNode) document.body.removeChild(overlay);
      };

      input.focus();
      input.addEventListener("input", enableCheck);

      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };

      input.onkeydown = (e) => {
        if (e.key === "Enter" && !confirmBtn.disabled) {
          cleanup();
          resolve(true);
        } else if (e.key === "Escape") {
          cleanup();
          resolve(false);
        }
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      };
    });
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Cargando sistema de administración…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-red-400/10 to-rose-600/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-orange-400/10 to-amber-600/10 blur-3xl"></div>
        </div>

        <div className="relative min-h-screen flex items-center justify-center p-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm max-w-md w-full">
            <div className="relative p-6 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Acceso Denegado</h2>
                  <p className="text-white/90 text-sm">Solo administradores</p>
                </div>
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="mb-6">
                <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  No tienes permisos para administrar usuarios. Esta sección
                  requiere privilegios de administrador.
                </p>
              </div>

              <button
                onClick={() => router.replace("/assembly/new")}
                className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white
                           hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                           transform hover:scale-105 transition-all duration-200
                           shadow-lg hover:shadow-xl font-semibold"
              >
                <ChevronLeft className="w-5 h-5" />
                Volver al Sistema
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-600/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/10 to-cyan-600/10 blur-3xl"></div>
      </div>

      <GlobalTopbar
        title="Administrar Usuarios"
        subtitle="Gestión completa de administradores, calidad y operadores"
        icon={Users}
        gradient="from-indigo-600 via-violet-600 to-purple-600"
        showBack={true}
        rightExtra={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/assembly/new")}
              className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              title="Ir a Assemblies"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <UserCircle2 className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Assemblies</span>
              </span>
            </button>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
              }}
              className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              title="Cerrar sesión"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">
                  Cerrar sesión
                </span>
              </span>
            </button>
          </div>
        }
        newButton={{
          label: "Agregar usuario",
          onClick: openCreate,
          icon: Plus,
        }}
      />

      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Filtros */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="relative p-6 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Filtros y Búsqueda
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Encuentra usuarios por cualquier campo o filtra por rol y
                  tabla
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por correo, nombre, nómina, RFID o ID…"
                  className="w-full pl-12 pr-10 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all duration-200"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                           text-slate-900 dark:text-slate-100
                           border-slate-200 dark:border-slate-700
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
                           transition-all duration-200"
              >
                <option value="all">Todos los roles</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                           text-slate-900 dark:text-slate-100
                           border-slate-200 dark:border-slate-700
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
                           transition-all duration-200"
              >
                <option value="all">Todas las tablas</option>
                <option value="usuarios">Tabla: Usuarios</option>
                <option value="operadores">Tabla: Operadores</option>
              </select>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Info className="w-4 h-4" />
                <span>
                  Mostrando{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {filteredUsers.length}
                  </span>{" "}
                  de {users.length} registros
                </span>
              </div>

              <button
                onClick={load}
                disabled={loading}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-gradient-to-r from-indigo-500 to-violet-500 text-white
                           hover:from-indigo-400 hover:to-violet-400
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-105 transition-all duration-200
                           shadow-lg hover:shadow-xl text-sm font-medium"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    loading
                      ? "animate-spin"
                      : "group-hover:rotate-180 transition-transform duration-300"
                  }`}
                />
                Recargar
              </button>
            </div>
          </div>
        </div>
        {/* Tabla */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="relative p-6 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Usuarios del Sistema
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Administradores, personal de calidad y operadores
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 grid place-items-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                  <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse opacity-50"></div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  Cargando usuarios…
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4 w-20">ID</th>
                    <th className="px-6 py-4 w-40">Origen</th>
                    <th className="px-6 py-4 w-56">Correo Electrónico</th>
                    <th className="px-6 py-4 w-48">Nombre Completo</th>
                    <th className="px-6 py-4 w-28">Nómina</th>
                    <th className="px-6 py-4 w-36">RFID</th>
                    <th className="px-6 py-4 w-36">Rol</th>
                    <th className="px-6 py-4 w-48 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedUsers.map((u, idx) => {
                    const roleConfig = getRoleConfig(u.rol);
                    const RoleIcon = roleConfig.icon;

                    return (
                      <tr
                        key={`${u.source}-${u.id}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                            {u.id ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
                                        bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900
                                        border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                          >
                            <BadgeCheck className="w-3 h-3" />
                            {u.source === "operadores"
                              ? "Operadores"
                              : "Usuarios"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {u.correo || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 dark:text-slate-100 uppercase font-medium">
                            {[u.nombre, u.apellido].filter(Boolean).join(" ") ||
                              "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                            {u.nomina || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400">
                            {u.rfid || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border
                                        ${roleConfig.bgColor} ${roleConfig.textColor} ${roleConfig.borderColor}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig.label}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(u)}
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200
                                       hover:border-indigo-300 transition-all duration-200 hover:scale-105"
                              title="Editar usuario"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </button>

                            <button
                              onClick={() => resetPassword(u)}
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200
                                       hover:border-amber-300 transition-all duration-200 hover:scale-105"
                              title="Resetear contraseña"
                            >
                              <Key className="w-3 h-3" />
                              Reset
                            </button>

                            <button
                              onClick={() => removeUser(u)}
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                       bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200
                                       hover:border-rose-300 transition-all duration-200 hover:scale-105"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                              <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 animate-pulse opacity-50"></div>
                          </div>
                          <div className="text-center">
                            <p className="text-slate-900 dark:text-slate-100 font-semibold text-lg">
                              No se encontraron usuarios
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                              Intenta ajustar los filtros o crear un nuevo
                              usuario
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPages > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredUsers.length)} de{" "}
                  {filteredUsers.length} registros
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                               bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                               hover:bg-slate-50 dark:hover:bg-slate-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200 text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Anterior
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                            page === currentPage
                              ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                               bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                               hover:bg-slate-50 dark:hover:bg-slate-700
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200 text-sm"
                  >
                    Siguiente
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 shadow-lg">
          <div className="p-6 border-b border-blue-200 dark:border-indigo-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  Información del Sistema
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Tipos de usuarios y sus características
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ROLE_OPTIONS.map((role, idx) => {
              const Icon = role.icon;
              const userCount = users.filter(
                (u) => Number(u.rol) === role.value
              ).length;

              return (
                <div
                  key={role.value}
                  className={`p-4 rounded-xl border-2 ${role.bgColor} ${role.borderColor} transition-all duration-200 hover:shadow-lg`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-r ${role.color} text-white flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className={`font-semibold ${role.textColor}`}>
                        {role.label}
                      </h5>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {userCount} usuario{userCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    {role.value === 1 && (
                      <>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Acceso completo al sistema</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Correo y contraseña obligatorios</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Gestión de usuarios</span>
                        </div>
                      </>
                    )}

                    {role.value === 2 && (
                      <>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Acceso a dashboard</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Correo y contraseña obligatorios</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Control de calidad</span>
                        </div>
                      </>
                    )}

                    {role.value === 3 && (
                      <>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>RFID obligatorio para acceso</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Nombre o nómina requerido</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                          <span>Sin operaciones en este sistema</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modal Component */}
      <UserFormModal
        show={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        saving={saving}
        showWarning={showWarning}
      />
    </div>
  );
}
