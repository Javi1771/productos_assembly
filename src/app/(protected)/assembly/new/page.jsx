"use client";

import { useEffect, useState } from "react";
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
  LogOut,
  Info,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { encodeItemId, decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

//? --- Persistencia de borrador del formulario ---
const DRAFT_KEY = "assembly:new:draft:v1";

const handleLogout = async () => {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    //! opcional: limpiar el borrador local
    clearDraft();
    router.replace("/login");
  } catch (e) {
    showError("No se pudo cerrar sesión");
  }
};

function loadDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

const MODULES = [
  { key: "Hose Cut", icon: Scissors, color: "from-amber-500 to-orange-500" },
  {
    key: "Sleeve/Guard cut",
    icon: CircleDot,
    color: "from-blue-500 to-indigo-500",
  },
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

  const [nextItem, setNextItem] = useState(null);
  const [createdItem, setCreatedItem] = useState(null);

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
  const [moduleStatus, setModuleStatus] = useState({}); //* Estado de cada módulo

  //* Al montar, hidrata el formulario desde el borrador guardado
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setDescripcion(draft.descripcion ?? "");
      setCustomer(draft.customer ?? "");
      setNci(draft.nci ?? "");
      setCustomerRev(draft.customerRev ?? "");
    }
  }, []);

  //* Guarda automáticamente cualquier cambio (debounce 250ms)
  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft({
        descripcion,
        customer,
        nci,
        customerRev,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [descripcion, customer, nci, customerRev]);

  //* Cargar estado de los módulos cuando hay un item creado
  async function loadModuleStatus() {
    if (!createdItem) {
      setModuleStatus({});
      return;
    }

    try {
      //* Hacer peticiones para verificar si cada módulo tiene datos
      const checks = await Promise.all([
        fetch(`/api/hose?assemblyItem=${createdItem}`, { cache: "no-store" }),
        fetch(`/api/sleeve-guard?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
        fetch(`/api/crimp-a?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
        fetch(`/api/collar-a?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
        fetch(`/api/crimp-b?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
        fetch(`/api/collar-b?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
        fetch(`/api/packaging?assemblyItem=${createdItem}`, {
          cache: "no-store",
        }),
      ]);

      const results = await Promise.all(
        checks.map((r) => r.json().catch(() => ({ ok: false })))
      );

      setModuleStatus({
        "Hose Cut": results[0]?.ok && results[0]?.hose ? true : false,
        "Sleeve/Guard cut":
          results[1]?.ok && results[1]?.sleeveGuard ? true : false,
        "Crimp A": results[2]?.ok && results[2]?.crimpA ? true : false,
        CollarA: results[3]?.ok && results[3]?.collarA ? true : false,
        "Crimp B": results[4]?.ok && results[4]?.crimpB ? true : false,
        CollarB: results[5]?.ok && results[5]?.collarB ? true : false,
        Packaging: results[6]?.ok && results[6]?.packaging ? true : false,
      });
    } catch (e) {
      //! En caso de error, asumir que no hay datos
      setModuleStatus({});
    }
  }

  //* Ejecutar cuando createdItem cambie
  useEffect(() => {
    loadModuleStatus();
  }, [createdItem]);

  //* Leer ?last=<token> cuando regresamos desde un subformulario (Hose, etc.)
  useEffect(() => {
    const last = searchParams.get("last");
    if (last) {
      const id = decodeItemId(last);
      if (id != null && !Number.isNaN(id)) {
        setCreatedItem(id); //* re-activa módulos y badge de "Item creado"
      }
    }
  }, [searchParams]);

  async function loadMeta() {
    setLoadingMeta(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/assembly", { cache: "no-store" }),
        fetch("/api/assembly/examples", { cache: "no-store" }),
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();

      if (!r1.ok || !d1?.ok)
        throw new Error(d1?.error || "Error al calcular Item");
      if (!r2.ok || !d2?.ok)
        throw new Error(d2?.error || "Error al cargar ejemplos");

      setNextItem(d1.nextItem);
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

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/assembly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion: descripcion.trim(),
          customer: customer.trim(),
          nci: nci.trim().toUpperCase(),
          customerRev: customerRev.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "No se pudo registrar");

      setCreatedItem(data.item.Item);
      showSuccess(`Producto registrado con Item ${data.item.Item}`);

      loadMeta();

      //* Recalcula estado de módulos inmediatamente
      loadModuleStatus();
    } catch (e) {
      showError(e.message, "Error de Registro");
    } finally {
      setLoading(false);
    }
  }

  const handleGoBack = () => router.back();

  const handleModuleClick = (m) => {
    if (!createdItem) {
      showWarning(
        "Guarda primero el producto para continuar con los formularios opcionales"
      );
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

  //* Botón "Empezar nuevo registro" — limpia todo y quita query params
  const handleNewRecord = () => {
    clearDraft(); //* Limpia borrador persistido
    setDescripcion(""); //* Limpia formulario
    setCustomer("");
    setNci("");
    setCustomerRev("");
    setCreatedItem(null); //* Limpia estado del assembly
    setModuleStatus({}); //* Limpia estado de módulos
    loadMeta(); //* Recalcula nextItem
    router.replace("/assembly/new"); //* Quita ?last=... y #anchors
  };

  if (loadingMeta) {
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
            Cargando datos del sistema…
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Preparando formulario de assembly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-600/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/10 to-cyan-600/10 blur-3xl"></div>
      </div>

      {/* Enhanced Topbar */}
      <GlobalTopbar
        title="Nuevo Assembly"
        subtitle="Sistema de gestión de productos"
        icon={Package2}
        gradient="from-indigo-600 via-violet-600 to-purple-600"
        showBack={false} //! <-- OCULTA "Volver"
        rightExtra={
          <div className="flex items-center gap-3">
            {/* Botón Dashboard */}
            <button
              onClick={() => router.push("/assembly/dashboard")}
              className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              title="Ver Dashboard"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <BarChart2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden xs:inline sm:inline">Dashboard</span>
              </span>
            </button>

            {/* Botón Cerrar sesión */}
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
              }}
              className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              title="Cerrar sesión"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="hidden xs:inline sm:inline">
                  Cerrar sesión
                </span>
              </span>
            </button>

            {/* Chip Item creado */}
            {createdItem && (
              <div className="flex items-center gap-2 text-xs bg-emerald-500/90 text-white px-3 py-2 rounded-lg border border-emerald-400 shadow-lg">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Item creado: <b>#{createdItem}</b>
                </span>
              </div>
            )}
          </div>
        }
        newButton={{
          label: "Empezar nuevo registro",
          onClick: handleNewRecord,
          icon: Sparkles,
        }}
      />

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Enhanced Form Section */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            {/* Enhanced Form Header */}
            <div className="relative p-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    Información del producto
                  </h2>
                  <p className="text-white/90 text-sm">
                    Complete los datos básicos. El Item se asigna
                    automáticamente al guardar.
                  </p>
                </div>
              </div>
            </div>

            <form
              id="assembly-form"
              onSubmit={onSubmit}
              className="p-8 space-y-8"
            >
              {/* Enhanced Description Field */}
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
                {/* Enhanced Customer Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    Customer (Marca)
                  </label>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value.toUpperCase())}
                    placeholder="Ej. John Deere, Caterpillar"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>
                      Ejemplos:{" "}
                      {examples.customers.slice(0, 3).join(" • ") ||
                        "Cargando..."}
                    </span>
                  </div>
                </div>

                {/* Enhanced NCI Field */}
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
                    <span>
                      Ejemplos:{" "}
                      {examples.ncis.slice(0, 3).join(" • ") || "Cargando..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced CustomerRev Field */}
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
                  <span>
                    Ejemplos:{" "}
                    {examples.customerRevs.slice(0, 3).join(" • ") ||
                      "Cargando..."}
                  </span>
                </div>
              </div>

              {/* Enhanced Submit Button */}
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
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Guardar Assembly
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
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                Información del Sistema
              </h4>
            </div>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <span>
                  El Item se asigna automáticamente siguiendo la secuencia del
                  sistema.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                <span>
                  Los códigos NCI se convierten automáticamente a mayúsculas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <span>
                  Completa los módulos adicionales después de guardar el
                  assembly principal.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Enhanced Sidebar */}
        <aside id="opcionales" className="space-y-6">
          {/* Enhanced Modules Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-5 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                  <PackageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Formularios Adicionales
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Módulos de proceso disponibles después del guardado
                  </p>
                </div>
              </div>
              {createdItem && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Assembly guardado como <b>#{createdItem}</b>
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
              {MODULES.map((m, index) => {
                const Icon = m.icon;
                const disabled = !createdItem;
                const hasData = moduleStatus[m.key] || false;

                return (
                  <button
                    key={m.key}
                    onClick={() => handleModuleClick(m)}
                    disabled={disabled}
                    className={`group w-full text-left p-4 rounded-xl border-2 transition-all duration-200 transform
                      ${
                        disabled
                          ? "cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
                          : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 hover:shadow-lg"
                      }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${m.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {/* Distintivo de datos completados */}
                        {hasData && !disabled && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg animate-pulse">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {m.key}
                          </span>
                          {hasData && !disabled && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                              Completado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {disabled
                            ? "Guarda primero el assembly"
                            : hasData
                            ? "Configurado - Click para editar"
                            : "Configurar módulo"}
                        </div>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full transition-colors ${
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
