// src/app/assembly/[item]/crimp-a/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Wrench,
  Info,
  AlertCircle,
  Edit3,
  Plus,
  Ruler,
  Settings,
  Hash,
  CheckCircle,
  Zap,
  Target,
  Cog
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";

export default function CrimpAPage() {
  const router = useRouter();
  const params = useParams();

  const rawParam = Array.isArray(params?.item) ? params.item[0] : params?.item;
  const token = typeof rawParam === "string" ? rawParam.trim() : "";
  const assemblyItem = decodeItemId(token);

  const { showSuccess, showError, showWarning } = useAlert();

  const [isEditing, setIsEditing] = useState(false);

  const [item, setItem] = useState("");
  const [fitting, setFitting] = useState("");
  const [minv, setMinv] = useState("");
  const [maxv, setMaxv] = useState("");
  const [nom, setNom] = useState("");
  const [curv, setCurv] = useState("R"); // puedes cambiar default si quieres
  const [dies, setDies] = useState("");
  const [crimp, setCrimp] = useState("");

  const [examples, setExamples] = useState({ items: [], fittings: [], dies: [], crimps: [] });
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const backToNew = () => {
    if (!token) return router.replace("/assembly/new");
    router.replace(`/assembly/new?last=${encodeURIComponent(token)}#opcionales`);
  };

  const numericFilter = (raw) => {
    let v = (raw || "").replace(/,/g, ".");
    v = v.replace(/[^\d.]/g, "");
    const i = v.indexOf(".");
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
    return v;
  };

  const oneLetterFilter = (raw) => {
    const v = String(raw || "").trim();
    return v ? v[0].toUpperCase() : "";
  };

  async function loadData() {
    if (assemblyItem == null) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    try {
      const [rex, rcur] = await Promise.all([
        fetch("/api/crimp-a/examples", { cache: "no-store" }),
        fetch(`/api/crimp-a?assemblyItem=${assemblyItem}`, { cache: "no-store" }),
      ]);
      const dex = await rex.json();
      const dcur = await rcur.json();

      if (!rex.ok || !dex?.ok) throw new Error(dex?.error || "No se pudieron cargar ejemplos");
      setExamples({
        items: dex.items || [],
        fittings: dex.fittings || [],
        dies: dex.dies || [],
        crimps: dex.crimps || [],
      });

      if (!rcur.ok || !dcur?.ok) throw new Error(dcur?.error || "No se pudo obtener Crimp A");

      if (dcur.crimpA) {
        setIsEditing(true);
        setItem(dcur.crimpA.Item != null ? String(dcur.crimpA.Item) : "");
        setFitting(dcur.crimpA.Fitting ?? "");
        setMinv(dcur.crimpA.Min != null ? String(dcur.crimpA.Min) : "");
        setNom(dcur.crimpA.Nom != null ? String(dcur.crimpA.Nom) : "");
        setMaxv(dcur.crimpA.Max != null ? String(dcur.crimpA.Max) : "");
        setCurv(dcur.crimpA.Curv ? String(dcur.crimpA.Curv).toUpperCase()[0] : "R");
        setDies(dcur.crimpA.Dies ?? "");
        setCrimp(dcur.crimpA.Crimp ?? "");
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
    setLoading(true);
    try {
      const r = await fetch("/api/crimp-a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyItem,
          item: isEditing ? null : Number(item), // requerido en inserción
          fitting: fitting.trim(),
          min: Number(minv),
          max: Number(maxv),
          nom: Number(nom),
          curv: curv.trim()[0]?.toUpperCase(),
          dies: dies.trim(),
          crimp: (crimp || "").trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar");

      showSuccess(`${isEditing ? "Crimp A actualizado" : "Crimp A guardado"}.`);
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Token Inválido</h2>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 dark:from-slate-950 dark:via-emerald-950 dark:to-green-950 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Cargando datos de Crimp A…</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Preparando configuración de engaste
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100 dark:from-slate-950 dark:via-emerald-950 dark:to-green-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/15 to-green-600/15 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-teal-400/15 to-emerald-600/15 blur-3xl"></div>
      </div>

      {/* Enhanced Topbar */}
      <header className="relative border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={backToNew}
                className="group px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Volver al Assembly
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Crimp A</h1>
                  <p className="text-white/80 text-xs">Configuración de primer engaste</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditing && (
                <div className="flex items-center gap-2 text-xs bg-emerald-500/90 text-white px-3 py-2 rounded-lg border border-emerald-400">
                  <Edit3 className="w-4 h-4" />
                  <span>Modo Edición</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs bg-white/15 border border-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Hash className="w-4 h-4" />
                <span>Assembly: <b>{assemblyItem}</b></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          {/* Enhanced Form Header */}
          <div className="relative p-6 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  {isEditing ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Editar Crimp A" : "Configurar Crimp A"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing ? "Modifica los parámetros del primer engaste" : "Define los parámetros del primer proceso de engaste"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-white/80 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>El <b>Item</b> se agregará a <b>Adds[3]</b> al crear</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Enhanced Item Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
                Item del Crimp A
                {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && <span className="text-xs text-emerald-600 dark:text-emerald-400">(Solo lectura)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className={`h-5 w-5 ${isEditing ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`} />
                </div>
                <input
                  value={item}
                  onChange={(e) => setItem(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Ej. 28389920"
                  required={!isEditing}
                  readOnly={isEditing}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 text-slate-900 dark:text-slate-100
                             transition-all duration-200
                             ${isEditing 
                               ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 cursor-not-allowed" 
                               : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500"
                             }`}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>Se agregará a Adds[3]. Ejemplos: {examples.items.slice(0, 3).join(" • ") || "Cargando..."}</span>
              </div>
            </div>

            {/* Enhanced Fitting Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Fitting
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Target className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  value={fitting}
                  onChange={(e) => setFitting(e.target.value.toUpperCase())}
                  placeholder="Ej. CONECTOR, TERMINAL, ADAPTADOR"
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
                <span>Ejemplos: {examples.fittings.slice(0, 3).join(" • ") || "Cargando..."}</span>
              </div>
            </div>

            {/* Enhanced Measurements Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medidas de Engaste
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
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
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
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
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
                    placeholder="0.00"
                    pattern="^\d*\.?\d*$"
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
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Configuración del Engaste</h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Curv Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Curv (Una letra)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={curv}
                    onChange={(e) => setCurv(oneLetterFilter(e.target.value))}
                    placeholder="R"
                    maxLength={1}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase text-center text-2xl font-bold
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500
                               transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ej. R, S, T</p>
                </div>

                {/* Crimp Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Cog className="w-4 h-4 text-amber-500" />
                    Tipo de Crimp
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={crimp}
                    onChange={(e) => setCrimp(e.target.value.toUpperCase() )}
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
                    <span>Ejemplos: {examples.crimps.slice(0, 3).join(" • ") || "NORMAL, ESPECIAL"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Dies Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500"></div>
                Dies (Matrices)
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Wrench className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  value={dies}
                  onChange={(e) => setDies(e.target.value.toUpperCase())}
                  placeholder="Ej. MATRIZ A, DIES SET 1, TOOL KIT X"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white dark:bg-slate-950/50
                             text-slate-900 dark:text-slate-100 uppercase
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500
                             transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>Ejemplos: {examples.dies.slice(0, 3).join(" • ") || "Cargando..."}</span>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                disabled={loading}
                type="submit"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white
                           hover:from-emerald-500 hover:via-green-500 hover:to-teal-500
                           focus:outline-none focus:ring-4 focus:ring-emerald-500/20
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
                    {isEditing ? <Edit3 className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    {isEditing ? "Actualizar Crimp A" : "Guardar Crimp A"}
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Info Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500 text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Información del Crimp A
            </h4>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
              <span>El <strong>Item</strong> se agrega automáticamente como tercer elemento (<strong>Adds[3]</strong>) del Assembly al crear un nuevo registro.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
              <span>Los campos <strong>Fitting</strong>, <strong>Min/Nom/Max</strong>, <strong>Curv</strong>, <strong>Dies</strong> y <strong>Crimp</strong> son todos obligatorios.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0"></div>
              <span>El campo <strong>Curv</strong> acepta solo una letra mayúscula (ej. R, S, T) y <strong>Crimp</strong> se convierte automáticamente a mayúsculas.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span>En modo edición, el campo <strong>Item</strong> es de solo lectura para mantener la integridad de los datos del Assembly.</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}