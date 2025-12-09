"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package2,
  Save,
  Loader2,
  Scissors,
  Wrench,
  CircleDot,
  Package as PackageIcon,
  Sparkles,
  CheckCircle,
  BarChart2,
  CircleAlert,
  LogOut,
  UserPen,
  Info,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { encodeItemId, decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

//? ---- helpers cookies (cliente) ----
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
function getUserRoleFromCookie() {
  const raw = getCookie("u_rol");
  return raw ? String(raw).trim() : null;
}

//* Borrador (sólo para "nuevo", evitamos interferir cuando editamos)
const DRAFT_KEY = "assembly:new:draft:v2";
const loadDraft = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return null;
  }
};
const saveDraft = (draft) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
};
const clearDraft = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
};

const MODULES = [
  { key: "Hose Cut", icon: Scissors, color: "from-amber-500 to-orange-500" },
  { key: "Sleeve/Guard cut", icon: CircleDot, color: "from-blue-500 to-indigo-500" },
  { key: "Crimp A", icon: Wrench, color: "from-green-500 to-emerald-500" },
  { key: "CollarA", icon: CircleDot, color: "from-purple-500 to-violet-500" },
  { key: "Crimp B", icon: Wrench, color: "from-pink-500 to-rose-500" },
  { key: "CollarB", icon: CircleDot, color: "from-teal-500 to-cyan-500" },
  { key: "Packaging", icon: PackageIcon, color: "from-gray-600 to-slate-600" },
];

export default function AssemblyNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError, showWarning } = useAlert();

  //* mount + roles
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState(null);

  //! Evitar parpadeos mientras redirigimos
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUserRole(getUserRoleFromCookie());
  }, []);

  const isAdmin = mounted && userRole === "1";
  const isCalidad = mounted && userRole === "2";

  //* Si es Calidad (rol 2), enviamos directo al dashboard y bloqueamos esta vista
  useEffect(() => {
    if (!mounted) return;
    if (userRole === "2") {
      setRedirecting(true);
      router.replace("/assembly/calidad");
    }
  }, [mounted, userRole, router]);

  //* estado base
  const [createdItem, setCreatedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [itemValue, setItemValue] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [customer, setCustomer] = useState("");
  const [nci, setNci] = useState("");
  const [customerRev, setCustomerRev] = useState("");

  const [examples, setExamples] = useState({
    customers: [],
    ncis: [],
    customerRevs: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingAssembly, setLoadingAssembly] = useState(false);

  const [moduleStatus, setModuleStatus] = useState({});

  //* ----- prevenir bucles: solo prefill UNA VEZ por item -----
  const loadedIdRef = useRef(null);

  //* helper para limpiar todo el formulario/estado
  const clearFormState = () => {
    setItemValue("");
    setDescripcion("");
    setCustomer("");
    setNci("");
    setCustomerRev("");
    setCreatedItem(null);
    setIsEditing(false);
    setModuleStatus({});
    loadedIdRef.current = null;
  };

  //* ----- hidratar borrador SOLO cuando no estamos editando -----
  useEffect(() => {
    if (isEditing) return;
    const draft = loadDraft();
    if (draft) {
      //! si el borrador es de otro rol, lo ignoramos y lo borramos
      if (draft.ownerRole && draft.ownerRole !== userRole) {
        clearDraft();
        return;
      }
      setItemValue(draft.itemValue ?? "");
      setDescripcion(draft.descripcion ?? "");
      setCustomer(draft.customer ?? "");
      setNci(draft.nci ?? "");
      setCustomerRev(draft.customerRev ?? "");
    }
  }, [isEditing, userRole]);

  //* ----- autosave borrador SOLO cuando no editamos -----
  useEffect(() => {
    if (isEditing) return;
    const t = setTimeout(() => {
      saveDraft({ ownerRole: userRole, itemValue, descripcion, customer, nci, customerRev });
    }, 250);
    return () => clearTimeout(t);
  }, [isEditing, userRole, itemValue, descripcion, customer, nci, customerRev]);

  //* ----- interpretar query params de forma ESTABLE -----
  const editParam = searchParams.get("edit");
  const itemParam = searchParams.get("item");
  const lastParam = searchParams.get("last");

  useEffect(() => {
    //* Modo edición
    if (editParam === "1" && itemParam) {
      const id = decodeItemId(itemParam);
      if (id != null && !Number.isNaN(id)) {
        if (loadedIdRef.current === id) return;
        loadedIdRef.current = id;

        setIsEditing(true);
        setCreatedItem(id);
        setItemValue(String(id));

        (async () => {
          setLoadingAssembly(true);
          try {
            const r = await fetch(`/api/assembly?item=${id}`, { cache: "no-store" });
            const d = await r.json();
            if (!r.ok || !d?.ok || !d.assembly) {
              throw new Error(d?.error || "Assembly no encontrado");
            }
            const a = d.assembly;
            setDescripcion(String(a.Description ?? ""));
            setCustomer(String(a.Customer ?? ""));
            setNci(String(a.NCI ?? ""));
            setCustomerRev(String(a.CustomerRev ?? ""));
          } catch (e) {
            showError(e.message || "No se pudo cargar el assembly para edición");
            setIsEditing(false);
          } finally {
            setLoadingAssembly(false);
          }
        })();

        return;
      }
    }

    //* Modo "volver desde módulo" - cargar datos pero NO en modo edición
    if (lastParam) {
      const id = decodeItemId(lastParam);
      if (id != null && !Number.isNaN(id)) {
        if (loadedIdRef.current === id) return;
        loadedIdRef.current = id;

        setCreatedItem(id);
        setIsEditing(false); //! NO es modo edición
        setItemValue(String(id));

        //* CARGAR LOS DATOS DEL ASSEMBLY
        (async () => {
          setLoadingAssembly(true);
          try {
            const r = await fetch(`/api/assembly?item=${id}`, { cache: "no-store" });
            const d = await r.json();
            if (!r.ok || !d?.ok || !d.assembly) {
              throw new Error(d?.error || "Assembly no encontrado");
            }
            const a = d.assembly;
            //* Llenar el formulario con los datos del assembly
            setDescripcion(String(a.Description ?? ""));
            setCustomer(String(a.Customer ?? ""));
            setNci(String(a.NCI ?? ""));
            setCustomerRev(String(a.CustomerRev ?? ""));
          } catch (e) {
            showError(e.message || "No se pudo cargar el assembly");
          } finally {
            setLoadingAssembly(false);
          }
        })();
      }
    }
  }, [editParam, itemParam, lastParam, showError]);

  //* meta (solo ejemplos)
  async function loadMeta() {
    setLoadingMeta(true);
    try {
      const r2 = await fetch("/api/assembly/examples", { cache: "no-store" });
      const d2 = await r2.json();
      if (!r2.ok || !d2?.ok) throw new Error(d2?.error || "Error al cargar ejemplos");
      setExamples({
        customers: d2.customers || [],
        ncis: d2.ncis || [],
        customerRevs: d2.customerRevs || [],
      });
    } catch (e) {
      showError(e.message, "Error de Carga");
    } finally {
      setLoadingMeta(false);
    }
  }
  useEffect(() => {
    loadMeta();
  }, []);

  //* estado de módulos (si hay createdItem)
  async function loadModuleStatus() {
    if (!createdItem) {
      setModuleStatus({});
      return;
    }
    try {
      const checks = await Promise.all([
        fetch(`/api/hose?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/sleeve-guard?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/crimp-a?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/collar-a?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/crimp-b?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/collar-b?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/packaging?assemblyItem=${createdItem}`, { cache: "no-store" }),
      ]);
      const results = await Promise.all(checks.map((r) => r.json().catch(() => ({ ok: false }))));

      setModuleStatus({
        "Hose Cut": results[0]?.ok && results[0]?.hose,
        "Sleeve/Guard cut": results[1]?.ok && results[1]?.sleeveGuard,
        "Crimp A": results[2]?.ok && results[2]?.crimpA,
        CollarA: results[3]?.ok && results[3]?.collarA,
        "Crimp B": results[4]?.ok && results[4]?.crimpB,
        CollarB: results[5]?.ok && results[5]?.collarB,
        Packaging: results[6]?.ok && results[6]?.packaging,
      });
    } catch {
      setModuleStatus({});
    }
  }
  useEffect(() => {
    loadModuleStatus();
  }, [createdItem]);

  const parseItem = (val) => {
    const n = Number(val);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
  };

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        item: parseItem(itemValue),
        descripcion: descripcion.trim(),
        customer: customer.trim(),
        nci: nci.trim().toUpperCase(),
        customerRev: customerRev.trim(),
      };

      if (isEditing) {
        if (!createdItem) throw new Error("Falta item en edición");
        const res = await fetch(`/api/assembly?item=${createdItem}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descripcion: payload.descripcion,
            customer: payload.customer,
            nci: payload.nci,
            customerRev: payload.customerRev,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "No se pudo actualizar");
        showSuccess(`Assembly #${createdItem} actualizado`);
      } else {
        if (!payload.item) throw new Error("Debes capturar un Item entero positivo");
        const res = await fetch("/api/assembly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "No se pudo registrar");
        setCreatedItem(data.item.Item);
        setItemValue(String(data.item.Item));
        showSuccess(`Producto registrado con Item ${data.item.Item}`);
      }

      loadModuleStatus();
    } catch (e) {
      showError(e.message, isEditing ? "Error de Actualización" : "Error de Registro");
    } finally {
      setLoading(false);
    }
  }

  const handleNewRecord = () => {
    clearDraft();
    clearFormState();
    router.replace("/assembly/new");
  };

  const handleModuleClick = (m) => {
    if (!createdItem) {
      showWarning("Guarda primero el producto para continuar con los formularios opcionales");
      return;
    }
    const token = encodeItemId(createdItem);
    const routeFor = (key) => {
      switch (key) {
        case "Hose Cut":
          return `/assembly/${token}/hose`;
        case "Sleeve/Guard cut":
          return `/assembly/${token}/sleeve-guard`;
        case "Crimp A":
          return `/assembly/${token}/crimp-a`;
        case "CollarA":
          return `/assembly/${token}/collar-a`;
        case "Crimp B":
          return `/assembly/${token}/crimp-b`;
        case "CollarB":
          return `/assembly/${token}/collar-b`;
        case "Packaging":
          return `/assembly/${token}/packaging`;
        default:
          return `/assembly/${token}/edit`;
      }
    };
    router.push(routeFor(m.key));
  };

  //* Limpiar si vienes de /login (post-login)
  useEffect(() => {
    if (!mounted) return;
    const cameFromLogin =
      typeof document !== "undefined" &&
      typeof document.referrer === "string" &&
      /\/login(?:\b|\/|$)/.test(document.referrer);
    if (cameFromLogin) {
      clearDraft();
      clearFormState();
    }
  }, [mounted]);

  //! Bloquear render si está redirigiendo por rol 2
  if (redirecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-slate-600">Redirigiendo al Dashboard…</p>
      </div>
    );
  }

  if (loadingMeta || (isEditing && loadingAssembly)) {
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
            {isEditing ? "Cargando assembly…" : "Cargando datos del sistema…"}
          </p>
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
        title={isEditing ? `Editar Assembly #${createdItem}` : "Nuevo Assembly"}
        subtitle={isEditing ? "Modifica los datos del assembly" : "Sistema de gestión de productos"}
        icon={Package2}
        gradient="from-indigo-600 via-violet-600 to-purple-600"
        showBack={false}
        rightExtra={
          <div className="flex items-center gap-3">
            {/* Dashboard para Calidad O Admin */}
            {(isCalidad || isAdmin) && (
              <button
                onClick={() => router.push("/assembly/dashboard")}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                title="Ver Dashboard"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">Dashboard</span>
                </span>
              </button>
            )}

            {(isCalidad || isAdmin) && (
              <button
                onClick={() => router.push("/assembly/calidad")}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                title="Control Calidad"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <CircleAlert className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">Calidad</span>
                </span>
              </button>
            )}

            {/* Admin: botón de usuarios */}
            {isAdmin && (
              <button
                onClick={() => router.push("/admin/usuarios/")}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                title="Agregar usuario"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <UserPen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden xs:inline sm:inline">Usuarios</span>
                </span>
              </button>
            )}

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
                <span className="hidden xs:inline sm:inline">Cerrar sesión</span>
              </span>
            </button>
          </div>
        }
        newButton={{
          label: "Empezar nuevo registro",
          onClick: handleNewRecord,
          icon: Sparkles,
        }}
      />

      {/* Formulario principal */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Editar datos del producto" : "Información del producto"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing ? "Actualiza los campos necesarios." : "Captura el Item manualmente y completa los datos."}
                  </p>
                </div>
              </div>
            </div>

            <form id="assembly-form" onSubmit={onSubmit} className="p-8 space-y-8">
              {/* ITEM (manual) */}
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-600 to-slate-800"></div>
                    Item (número)
                  </label>
                  <input
                    value={itemValue}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, ""); //* solo dígitos
                      setItemValue(v);
                    }}
                    inputMode="numeric"
                    pattern="^[1-9]\d*$"
                    title="Ingresa un entero positivo"
                    placeholder="Ej. 1001"
                    required={!isEditing}
                    disabled={isEditing}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                              text-slate-900 dark:text-slate-100 placeholder-slate-400
                              border-slate-200 dark:border-slate-700
                              focus:outline-none focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500
                              transition-all duration-200 disabled:opacity-60"
                  />
                  {!isEditing && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Debe ser único. El sistema validará duplicados.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                  Descripción del Assembly
                </label>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.toUpperCase())}
                  placeholder="Ej. 8808547, AT500732, 7171210"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
                             transition-all duration-200"
                />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    Customer (Marca)
                  </label>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value.toUpperCase())}
                    placeholder="Ej. JOHN DEERE, CATERPILLAR"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>Ejemplos: {examples.customers.slice(0, 3).join(" • ") || "Cargando..."}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    NCI (Código)
                  </label>
                  <input
                    value={nci}
                    onChange={(e) => setNci(e.target.value.toUpperCase())}
                    placeholder="Ej. TF-A-0020, HYD-B-1234"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 uppercase bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500
                               transition-all duration-200 font-mono"
                  />
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>Ejemplos: {examples.ncis.slice(0, 3).join(" • ") || "Cargando..."}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                  CustomerRev (Revisión del Cliente)
                </label>
                <input
                  value={customerRev}
                  onChange={(e) => setCustomerRev(e.target.value.toUpperCase())}
                  placeholder="Ej. B3, A2 /121754, Rev. 3.1"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                             transition-all duration-200"
                />
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-3 h-3" />
                  <span>Ejemplos: {examples.customerRevs.slice(0, 3).join(" • ") || "Cargando..."}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  disabled={loading}
                  type="submit"
                  className="group relative inline-flex items-center gap-3 px-8 py-3 rounded-xl
                             bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white
                             hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500
                             focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transform hover:scale-105 transition-all duration-200
                             shadow-lg hover:shadow-xl font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isEditing ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isEditing ? "Actualizar Assembly" : "Guardar Assembly"}
                    </>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </div>
            </form>
          </div>

          <br />

          {/* Enhanced Info Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Info className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Información del Sistema</h4>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <span>Ahora el <b>Item</b> se captura manualmente y debe ser único.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                <span>Los códigos NCI se convierten automáticamente a mayúsculas.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <span>Completa los módulos adicionales después de guardar el assembly principal.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Sidebar de módulos */}
        <aside id="opcionales" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-5 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                  <PackageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Formularios Adicionales</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {createdItem ? "Selecciona para configurar o editar" : "Disponibles después de guardar"}
                  </p>
                </div>
              </div>
              {createdItem && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Assembly activo <b>#{createdItem}</b>
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {MODULES.map((m, idx) => {
                const Icon = m.icon;
                const disabled = !createdItem;
                const hasData = !!moduleStatus[m.key];
                return (
                  <button
                    key={m.key}
                    onClick={() => handleModuleClick(m)}
                    disabled={disabled}
                    className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                      ${
                        disabled
                          ? "cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
                      }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${m.color} text-white grid place-items-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{m.key}</span>
                          {hasData && !disabled && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                              Completado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {disabled ? "Guarda primero el assembly" : hasData ? "Configurado — Click para editar" : "Configurar módulo"}
                        </div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          disabled
                            ? "bg-slate-300 dark:bg-slate-600"
                            : hasData
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500"
                        }`}
                      ></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
