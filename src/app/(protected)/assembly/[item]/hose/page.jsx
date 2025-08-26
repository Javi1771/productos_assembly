"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Scissors,
  Info,
  AlertCircle,
  Edit3,
  Plus,
  Ruler,
  FileText,
  Hash,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

export default function HoseCutPage() {
  const router = useRouter();
  const params = useParams();

  //* leer el segmento [item] de la ruta (token base64-url)
  const rawParam = Array.isArray(params?.item) ? params.item[0] : params?.item;
  const token = typeof rawParam === "string" ? rawParam.trim() : "";
  const assemblyItem = decodeItemId(token);

  const { showSuccess, showError, showWarning } = useAlert();

  const [item, setItem] = useState(""); //* Item Hose (irá a Adds[0])
  const [description, setDescription] = useState("");
  const [minv, setMinv] = useState("");
  const [maxv, setMaxv] = useState("");
  const [nom, setNom] = useState("");
  const [clea, setClea] = useState("");

  const [examples, setExamples] = useState({
    items: [],
    descriptions: [],
    cleas: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isEditing, setIsEditing] = useState(false); //! <-- si ya hay Hose guardado

  //* Volver a la pantalla anterior con el assembly activo
  const backToNew = () => {
    if (!token) return router.replace("/assembly/new");
    router.replace(
      `/assembly/new?last=${encodeURIComponent(token)}#opcionales`
    );
  };

  //* Permitir solo números (y un punto) para Min/Nom/Max
  const numericFilter = (raw) => {
    let v = (raw || "").replace(/,/g, "."); //! admitir coma como punto
    v = v.replace(/[^\d.]/g, ""); //! solo dígitos y puntos
    const i = v.indexOf(".");
    if (i !== -1) {
      //! permitir solo un punto decimal
      v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
    }
    return v;
  };

  async function loadData() {
    if (assemblyItem == null) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    try {
      //* Cargar ejemplos y (si existe) el Hose ligado al assembly
      const [rex, rcur] = await Promise.all([
        fetch("/api/hose/examples", { cache: "no-store" }),
        fetch(`/api/hose?assemblyItem=${assemblyItem}`, { cache: "no-store" }),
      ]);
      const dex = await rex.json();
      const dcur = await rcur.json();

      if (!rex.ok || !dex?.ok)
        throw new Error(dex?.error || "No se pudieron cargar ejemplos");
      setExamples({
        items: dex.items || [],
        descriptions: dex.descriptions || [],
        cleas: dex.cleas || [],
      });

      if (!rcur.ok || !dcur?.ok)
        throw new Error(dcur?.error || "No se pudo obtener Hose");

      if (dcur.hose) {
        //* Modo edición: prellenar y bloquear Item
        setIsEditing(true);
        setItem(String(dcur.hose.Item ?? "")); //! Item no editable en edición
        setDescription(dcur.hose.Description ?? "");
        setMinv(dcur.hose.Min != null ? String(dcur.hose.Min) : "");
        setNom(dcur.hose.Nom != null ? String(dcur.hose.Nom) : "");
        setMaxv(dcur.hose.Max != null ? String(dcur.hose.Max) : "");
        setClea(dcur.hose.Clea ?? "");
      } else {
        //! Nuevo: sin bloqueo de Item
        setIsEditing(false);
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoadingMeta(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [assemblyItem]);

  async function onSubmit(e) {
    e.preventDefault();
    if (assemblyItem == null) {
      showWarning("Falta el Assembly Item en la ruta");
      return;
    }
    if (!item) {
      showWarning("Item es requerido");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/hose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyItem,
          item: Number(item), //* aunque esté bloqueado en edición, se envía
          description: description.trim(),
          min: minv === "" ? null : Number(minv),
          max: maxv === "" ? null : Number(maxv),
          nom: nom === "" ? null : Number(nom),
          clea: clea.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar");

      showSuccess(
        `${isEditing ? "Hose actualizado" : "Hose guardado"} (Item ${
          d.hose.item
        }). Adds actualizado en Assembly #${d.assembly.item}`
      );

      //* Regresar a la pantalla anterior con el assembly activo
      setTimeout(() => backToNew(), 900);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (assemblyItem == null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-950 dark:via-red-950 dark:to-rose-950 grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Token Inválido
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-6">
            El token de Assembly es inválido o ha expirado.
          </p>
          <button
            onClick={() => router.replace("/assembly/new")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a crear Assembly
          </button>
        </div>
      </div>
    );
  }

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 dark:from-slate-950 dark:via-amber-950 dark:to-orange-950 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
            Cargando datos de Hose…
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Preparando formulario de corte
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-100 dark:from-slate-950 dark:via-amber-950 dark:to-orange-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/15 to-orange-600/15 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-yellow-400/15 to-amber-600/15 blur-3xl"></div>
      </div>

      {/* Enhanced Topbar */}
      <GlobalTopbar
        title="Hose Cut"
        subtitle="Configuración de corte"
        icon={Scissors}
        gradient="from-amber-600 via-orange-600 to-red-600"
        containerMax="max-w-6xl"
        onBack={backToNew}
        rightExtra={
          <div className="flex items-center gap-3">
            {isEditing && (
              <div className="flex items-center gap-2 text-xs bg-amber-500/90 text-white px-3 py-2 rounded-lg border border-amber-400">
                <Edit3 className="w-4 h-4" />
                <span>Modo Edición</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs bg-white/15 border border-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
              <Hash className="w-4 h-4" />
              <span>
                Assembly: <b>{assemblyItem}</b>
              </span>
            </div>
          </div>
        }
      />

      {/* Enhanced Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {/* Enhanced Form Header */}
          <div className="relative p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  {isEditing ? (
                    <Edit3 className="w-6 h-6" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Editar Datos de Hose" : "Configurar Hose Cut"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing
                      ? "Modifica los parámetros existentes"
                      : "Define los parámetros de corte"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-white/80 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>
                    El <b>Item</b> se agregará automáticamente a <b>Adds</b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Enhanced Item Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                Item del Hose
                {isEditing && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    (Solo lectura)
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash
                    className={`h-5 w-5 ${
                      isEditing
                        ? "text-amber-500"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </div>
                <input
                  value={item}
                  onChange={(e) => setItem(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Ej. 788828"
                  required
                  readOnly={isEditing}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 text-slate-900 dark:text-slate-100
                             transition-all duration-200
                             ${
                               isEditing
                                 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 cursor-not-allowed"
                                 : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                             }`}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Ejemplos recientes:{" "}
                  {examples.items.slice(0, 3).join(" • ") || "Cargando..."}
                </span>
              </div>
            </div>

            {/* Enhanced Description Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Descripción del Corte
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value.toUpperCase())}
                  placeholder="Ej. 10M4K, 8M3K-XTF, 10M4K+  2BRD  BALE"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white dark:bg-slate-950/50
                             text-slate-900 dark:text-slate-100
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                             transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Ejemplos:{" "}
                  {examples.descriptions.slice(0, 3).join(" • ") ||
                    "Cargando..."}
                </span>
              </div>
            </div>

            {/* Enhanced Measurements Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medidas de Corte
                </h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Ruler className="w-4 h-4 text-green-500" />
                    Mínimo
                  </label>
                  <input
                    value={minv}
                    onChange={(e) => setMinv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500
                               transition-all duration-200 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Ruler className="w-4 h-4 text-blue-500" />
                    Nominal
                  </label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(numericFilter(e.target.value))}
                    inputMode="decimal"
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                               transition-all duration-200 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Ruler className="w-4 h-4 text-red-500" />
                    Máximo
                  </label>
                  <input
                    value={maxv}
                    onChange={(e) => setMaxv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Clea Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
                Clea (Información Adicional)
              </label>
              <textarea
                value={clea}
                onChange={(e) => setClea(e.target.value.toUpperCase())}
                placeholder="Información adicional, notas especiales o características del corte..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                           text-slate-900 dark:text-slate-100
                           border-slate-200 dark:border-slate-700
                           focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                           transition-all duration-200 resize-none"
              />
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Ejemplos:{" "}
                  {examples.cleas.slice(0, 3).join(" • ") || "Cargando..."}
                </span>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                disabled={loading}
                type="submit"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white
                           hover:from-amber-500 hover:via-orange-500 hover:to-red-500
                           focus:outline-none focus:ring-4 focus:ring-amber-500/20
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transform hover:scale-105 transition-all duration-200
                           shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isEditing ? "Actualizando..." : "Guardando..."}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    ) : (
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    {isEditing ? "Actualizar Hose Cut" : "Guardar Hose Cut"}
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500 text-white">
              <Info className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Información del Proceso
            </h4>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span>
                El <strong>Item</strong> especificado se agregará
                automáticamente como primer elemento en el campo{" "}
                <strong>Adds</strong> del Assembly.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
              <span>
                Las medidas <strong>Min</strong>, <strong>Nom</strong> y{" "}
                <strong>Max</strong> definen los parámetros de tolerancia para
                el corte.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
              <span>
                Use el campo <strong>Clea</strong> para agregar notas especiales
                o características del proceso de corte.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
