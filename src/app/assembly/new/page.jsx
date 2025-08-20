// src/app/assembly/new/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package2,
  Save,
  ArrowLeft,
  Loader2,
  Scissors,
  Wrench,
  CircleDot,
  Package as PackageIcon,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { encodeItemId, decodeItemId } from "@/lib/idCodec";

const MODULES = [
  { key: "Hose Cut", icon: Scissors },
  { key: "Sleeve/Guard cut", icon: CircleDot },
  { key: "Crimp A", icon: Wrench },
  { key: "CollarA", icon: CircleDot },
  { key: "Crimp B", icon: Wrench },
  { key: "CollarB", icon: CircleDot },
  { key: "Packaging", icon: PackageIcon },
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

  // Leer ?last=<token> cuando regresamos desde un subformulario (Hose, etc.)
  useEffect(() => {
    const last = searchParams.get("last");
    if (last) {
      const id = decodeItemId(last);
      if (id != null && !Number.isNaN(id)) {
        setCreatedItem(id); // re-activa módulos y badge de "Item creado"
      }
      // Si quieres, podrías limpiar el query param:
      // router.replace("/assembly/new#opcionales");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // limpia y recalcula
      setDescripcion("");
      setCustomer("");
      setNci("");
      setCustomerRev("");
      loadMeta();
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

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Cargando datos…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Topbar con degradado sutil */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/20"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </span>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold inline-flex items-center gap-2">
              <Package2 className="w-5 h-5" /> Nuevo Assembly
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs bg-white/15 border border-white/20 px-2 py-1 rounded-md">
              Siguiente Item: <b>{nextItem ?? "—"}</b>
            </span>
            {createdItem && (
              <span className="text-xs bg-emerald-400/90 text-slate-900 px-2 py-1 rounded-md border border-emerald-300">
                Item creado: <b>#{createdItem}</b>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <section className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            {/* Encabezado del card con degradado */}
            <div className="p-5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
              <h2 className="text-base font-semibold">
                Información del producto
              </h2>
              <p className="text-white/80 text-xs">
                Escribe los campos. El Item se asigna automáticamente al
                guardar.
              </p>
            </div>

            <form
              id="assembly-form"
              onSubmit={onSubmit}
              className="p-6 space-y-6"
            >
              {/* Descripción */}
              <div>
                <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Descripción
                </div>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. Conjunto de transmisión TF-A"
                  required
                  className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100
                             border-slate-300 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Customer */}
                <div>
                  <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Customer (Marca)
                  </div>
                  <input
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="Ej. John Deere"
                    required
                    className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100
                               border-slate-300 dark:border-slate-700
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Ejemplos:{" "}
                    {examples.customers.slice(0, 3).join(" • ") || "—"}
                  </p>
                </div>

                {/* NCI */}
                <div>
                  <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    NCI (Código)
                  </div>
                  <input
                    value={nci}
                    onChange={(e) => setNci(e.target.value)}
                    placeholder="Ej. TF-A-0020"
                    required
                    className="w-full px-3 py-2 rounded-md border uppercase bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100
                               border-slate-300 dark:border-slate-700
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Ejemplos: {examples.ncis.slice(0, 3).join(" • ") || "—"}
                  </p>
                </div>
              </div>

              {/* CustomerRev */}
              <div>
                <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  CustomerRev (Revisión del Cliente)
                </div>
                <input
                  value={customerRev}
                  onChange={(e) => setCustomerRev(e.target.value)}
                  placeholder="Ej. B3, A2 /121754"
                  required
                  className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100
                             border-slate-300 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Ejemplos:{" "}
                  {examples.customerRevs.slice(0, 3).join(" • ") || "—"}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  disabled={loading}
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md
                             bg-gradient-to-r from-indigo-600 to-violet-600 text-white
                             hover:from-indigo-500 hover:to-violet-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500
                             disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Lateral: Formularios adicionales */}
        <aside id="opcionales" className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            {/* Header lateral con degradado fino */}
            <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Formularios adicionales
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Se habilitan al guardar el Assembly.
              </p>
              {createdItem && (
                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Assembly guardado como <b>#{createdItem}</b>
                </div>
              )}
            </div>

            <div className="p-3 grid grid-cols-1 gap-2">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const disabled = !createdItem;
                return (
                  <button
                    key={m.key}
                    onClick={() => handleModuleClick(m)}
                    disabled={disabled}
                    className={`w-full text-left px-3 py-2 rounded-md border transition group
                      ${
                        disabled
                          ? "cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                      <span
                        className="w-6 h-6 rounded-md grid place-items-center
                        bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      {m.key}
                    </span>
                    <span className="block text-[11px] mt-0.5 text-slate-500 dark:text-slate-400">
                      {disabled ? "Guarda primero" : "Abrir"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota breve */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
            <ul className="text-[12px] text-slate-600 dark:text-slate-400 space-y-1.5">
              <li>• El Item se asigna automáticamente.</li>
              <li>• NCI en mayúsculas (ej. TF-A-0020).</li>
              <li>• Completa los módulos opcionales después de guardar.</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
