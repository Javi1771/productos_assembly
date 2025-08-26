// src/app/assembly/[item]/collar-b/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  CircleDot,
  Info,
  AlertCircle,
  Edit3,
  Plus,
  Ruler,
  FileText,
  Hash,
  CheckCircle,
  Zap,
  Settings,
  Wrench,
  Shield,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

export default function CollarBPage() {
  const router = useRouter();
  const params = useParams();

  const raw = Array.isArray(params?.item) ? params.item[0] : params?.item;
  const token = typeof raw === "string" ? raw.trim() : "";
  const assemblyItem = decodeItemId(token);

  const { showSuccess, showError, showWarning } = useAlert();

  const [isEditing, setIsEditing] = useState(false);

  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [minv, setMinv] = useState("");
  const [nom, setNom] = useState("");
  const [maxv, setMaxv] = useState("");
  const [dies, setDies] = useState("");
  const [crimp, setCrimp] = useState("");

  const [examples, setExamples] = useState({
    items: [],
    descriptions: [],
    dies: [],
    crimps: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const backToNew = () => {
    if (!token) return router.replace("/assembly/new");
    router.replace(
      `/assembly/new?last=${encodeURIComponent(token)}#opcionales`
    );
  };

  const numericFilter = (raw) => {
    let v = (raw || "").replace(/,/g, ".");
    v = v.replace(/[^\d.]/g, "");
    const i = v.indexOf(".");
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
    return v;
  };

  async function loadData() {
    if (assemblyItem == null) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    try {
      const [rex, rcur] = await Promise.all([
        fetch("/api/collar-b/examples", { cache: "no-store" }),
        fetch(`/api/collar-b?assemblyItem=${assemblyItem}`, {
          cache: "no-store",
        }),
      ]);
      const dex = await rex.json();
      const dcur = await rcur.json();

      if (!rex.ok || !dex?.ok)
        throw new Error(dex?.error || "No se pudieron cargar ejemplos");
      setExamples({
        items: dex.items || [],
        descriptions: dex.descriptions || [],
        dies: dex.dies || [],
        crimps: dex.crimps || [],
      });

      if (!rcur.ok || !dcur?.ok)
        throw new Error(dcur?.error || "No se pudo obtener Collar B");

      if (dcur.collarB) {
        setIsEditing(true);
        setItem(dcur.collarB.Item != null ? String(dcur.collarB.Item) : "");
        setDescription(dcur.collarB.Description ?? "");
        setMinv(dcur.collarB.Min != null ? String(dcur.collarB.Min) : "");
        setNom(dcur.collarB.Nom != null ? String(dcur.collarB.Nom) : "");
        setMaxv(dcur.collarB.Max != null ? String(dcur.collarB.Max) : "");
        setDies(dcur.collarB.Dies ?? "");
        setCrimp(dcur.collarB.Crimp ?? "");
      } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblyItem]);

  async function onSubmit(e) {
    e.preventDefault();
    if (assemblyItem == null) {
      showWarning("Falta el Assembly Item en la ruta");
      return;
    }
    if (!isEditing && !item) {
      showWarning("Item es obligatorio al crear");
      return;
    }

    // Todos obligatorios en CollarB:
    if (!description.trim()) return showWarning("Description es obligatoria");
    if (!minv.trim()) return showWarning("Min es obligatorio");
    if (!nom.trim()) return showWarning("Nom es obligatorio");
    if (!maxv.trim()) return showWarning("Max es obligatorio");
    if (!dies.trim()) return showWarning("Dies es obligatorio");
    if (!crimp.trim()) return showWarning("Crimp es obligatorio");

    setLoading(true);
    try {
      const r = await fetch("/api/collar-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyItem,
          item: isEditing ? null : Number(item),
          description: description.toUpperCase(),
          min: Number(minv),
          nom: Number(nom),
          max: Number(maxv),
          dies: dies.toUpperCase(),
          crimp: crimp.toUpperCase(),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar");

      showSuccess(
        `${isEditing ? "Collar B actualizado" : "Collar B guardado"}.`
      );
      setTimeout(() => backToNew(), 900);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Check if all required fields are filled
  const isFormValid =
    (!isEditing ? item : true) &&
    description &&
    minv &&
    nom &&
    maxv &&
    dies &&
    crimp;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-teal-950 dark:to-cyan-950 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
            Cargando datos de Collar B…
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Preparando configuración de segundo collar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-100 dark:from-slate-950 dark:via-teal-950 dark:to-cyan-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-teal-400/15 to-cyan-600/15 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-400/15 to-teal-600/15 blur-3xl"></div>
      </div>

      {/* Enhanced Topbar */}
      <GlobalTopbar
        title="Collar B"
        subtitle="Configuración de segundo collar protector"
        icon={Shield}
        gradient="from-teal-600 via-cyan-600 to-blue-600"
        onBack={backToNew}
        rightExtra={
          <div className="flex items-center gap-3">
            {/* Chip modo edición */}
            {isEditing && (
              <div className="flex items-center gap-2 text-xs bg-teal-500/90 text-white px-3 py-2 rounded-lg border border-teal-400">
                <Edit3 className="w-4 h-4" />
                <span>Modo Edición</span>
              </div>
            )}

            {/* Chip Assembly */}
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
          <div className="relative p-6 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white">
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
                    {isEditing ? "Editar Collar B" : "Configurar Collar B"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing
                      ? "Modifica los parámetros del segundo collar protector"
                      : "Define los parámetros del segundo collar de protección"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-white/80 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>
                    El <b>Item</b> se agregará a <b>Adds[6]</b> al crear
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Required Fields Alert */}
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Todos los campos son obligatorios para el Collar B
                </p>
              </div>
            </div>

            {/* Enhanced Item Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                Item del Collar B
                {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && (
                  <span className="text-xs text-teal-600 dark:text-teal-400">
                    (Solo lectura)
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash
                    className={`h-5 w-5 ${
                      isEditing
                        ? "text-teal-500"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </div>
                <input
                  value={item}
                  onChange={(e) => setItem(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Ej. 12345678"
                  required={!isEditing}
                  readOnly={isEditing}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 text-slate-900 dark:text-slate-100
                             transition-all duration-200
                             ${
                               isEditing
                                 ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800 cursor-not-allowed"
                                 : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500"
                             }`}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Se agregará a Adds[6]. Ejemplos:{" "}
                  {examples.items.slice(0, 3).join(" • ") || "Cargando..."}
                </span>
              </div>
            </div>

            {/* Enhanced Description Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Descripción del Collar B<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value.toUpperCase())}
                  placeholder="Ej. 12SC-2, TAPE, VINYL BLACK, 0.5, 12SC-2"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white dark:bg-slate-950/50
                             text-slate-900 dark:text-slate-100 uppercase
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                             transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Se convierte automáticamente a mayúsculas. Ejemplos:{" "}
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
                  Medidas del Collar B
                  <span className="text-red-500 ml-1">*</span>
                </h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Ruler className="w-4 h-4 text-green-500" />
                    Mínimo
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={minv}
                    onChange={(e) => setMinv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
                    required
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
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
                    required
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
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={maxv}
                    onChange={(e) => setMaxv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Configuration Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Configuración del Collar B
                  <span className="text-red-500 ml-1">*</span>
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Dies Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    Dies (Matrices)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={dies}
                    onChange={(e) => setDies(e.target.value.toUpperCase())}
                    placeholder="Ej. FP-35, FP-36, FP-33"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>
                      Ejemplos:{" "}
                      {examples.dies.slice(0, 3).join(" • ") || "Cargando..."}
                    </span>
                  </div>
                </div>

                {/* Crimp Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Settings className="w-4 h-4 text-amber-500" />
                    Tipo de Crimp
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={crimp}
                    onChange={(e) => setCrimp(e.target.value.toUpperCase())}
                    placeholder="NORMAL"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>
                      Ejemplos:{" "}
                      {examples.crimps.slice(0, 3).join(" • ") || "Cargando..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                disabled={loading || !isFormValid}
                type="submit"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white
                           hover:from-teal-500 hover:via-cyan-500 hover:to-blue-500
                           focus:outline-none focus:ring-4 focus:ring-teal-500/20
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
                    {isEditing ? "Actualizar Collar B" : "Guardar Collar B"}
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Info Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-teal-500 text-white">
              <Shield className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Información del Collar B
            </h4>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
              <span>
                El <strong>Item</strong> se agrega automáticamente como sexto
                elemento (<strong>Adds[6]</strong>) del Assembly al crear un
                nuevo registro.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0"></div>
              <span>
                <strong>Todos los campos son obligatorios</strong> para el
                Collar B, incluyendo Item (solo al crear), Description,
                Min/Nom/Max, Dies y Crimp.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
              <span>
                Los campos <strong>Description</strong>, <strong>Dies</strong> y{" "}
                <strong>Crimp</strong> se convierten automáticamente a
                mayúsculas.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span>
                En modo edición, el campo <strong>Item</strong> es de solo
                lectura para mantener la integridad de los datos del Assembly.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
