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
  FileText,
  Hash,
  CheckCircle,
  Zap,
  Settings,
  Target,
  Cog,
  Tool,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

export default function CrimpBPage() {
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
  const [curv, setCurv] = useState("");
  const [dies, setDies] = useState("");
  const [crimp, setCrimp] = useState("");
  const [minO, setMinO] = useState("");
  const [nomO, setNomO] = useState("");
  const [maxO, setMaxO] = useState("");

  const [examples, setExamples] = useState({
    items: [],
    descriptions: [],
    dies: [],
    crimps: [],
    curvs: [],
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
        fetch("/api/crimp-b/examples", { cache: "no-store" }),
        fetch(`/api/crimp-b?assemblyItem=${assemblyItem}`, {
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
        curvs: dex.curvs || [],
      });

      if (!rcur.ok || !dcur?.ok)
        throw new Error(dcur?.error || "No se pudo obtener Crimp B");

      if (dcur.crimpB) {
        setIsEditing(true);
        setItem(dcur.crimpB.Item != null ? String(dcur.crimpB.Item) : "");
        setDescription(dcur.crimpB.Description ?? "");
        setMinv(dcur.crimpB.Min != null ? String(dcur.crimpB.Min) : "");
        setNom(dcur.crimpB.Nom != null ? String(dcur.crimpB.Nom) : "");
        setMaxv(dcur.crimpB.Max != null ? String(dcur.crimpB.Max) : "");
        setCurv(dcur.crimpB.Curv ?? "");
        setDies(dcur.crimpB.Dies ?? "");
        setCrimp(dcur.crimpB.Crimp ?? "");
        setMinO(dcur.crimpB.MinO != null ? String(dcur.crimpB.MinO) : "");
        setNomO(dcur.crimpB.NomO != null ? String(dcur.crimpB.NomO) : "");
        setMaxO(dcur.crimpB.MaxO != null ? String(dcur.crimpB.MaxO) : "");
        setMinO(dcur.crimpB.MinO != null ? String(dcur.crimpB.MinO) : "");
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
    if (!description) {
      showWarning("Description es obligatoria");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/crimp-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyItem,
          item: isEditing ? null : Number(item),
          description: description,
          min: minv === "" ? null : Number(minv),
          nom: nom === "" ? null : Number(nom),
          max: maxv === "" ? null : Number(maxv),
          curv: curv || null,
          dies: dies || null,
          crimp: crimp || null,
          minO: minO === "" ? null : Number(minO),
          nomO: nomO === "" ? null : Number(nomO),
          maxO: maxO === "" ? null : Number(maxO),
          minO: minO === "" ? null : Number(minO),
        }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar");

      showSuccess(`${isEditing ? "Crimp B actualizado" : "Crimp B guardado"}.`);
      setTimeout(() => backToNew(), 900);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = (!isEditing ? item : true) && description;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-50 dark:from-slate-950 dark:via-rose-950 dark:to-pink-950 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-rose-500 to-pink-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
            Cargando datos de Crimp B…
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Preparando configuración de segundo engaste
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-pink-100 dark:from-slate-950 dark:via-rose-950 dark:to-pink-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-rose-400/15 to-pink-600/15 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-red-400/15 to-rose-600/15 blur-3xl"></div>
      </div>

      {/* Enhanced Topbar */}
      <GlobalTopbar
        title="Crimp B"
        subtitle="Configuración de segundo engaste"
        icon={Wrench}
        gradient="from-rose-600 via-pink-600 to-red-600"
        containerMax="max-w-6xl"
        onBack={backToNew}
        rightExtra={
          <div className="flex items-center gap-3">
            {isEditing && (
              <div className="flex items-center gap-2 text-xs bg-rose-500/90 text-white px-3 py-2 rounded-lg border border-rose-400">
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
          <div className="relative p-6 bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white">
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
                    {isEditing ? "Editar Crimp B" : "Configurar Crimp B"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing
                      ? "Modifica los parámetros del segundo engaste"
                      : "Define los parámetros del segundo proceso de engaste"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-white/80 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>
                    El <b>Item</b> se agregará a <b>Adds[5]</b> al crear
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Required Fields Alert */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  <strong>Item</strong> (solo al crear) y{" "}
                  <strong>Description</strong> son obligatorios. Los demás
                  campos son opcionales.
                </p>
              </div>
            </div>

            {/* Enhanced Item Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500"></div>
                Item del Crimp B
                {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && (
                  <span className="text-xs text-rose-600 dark:text-rose-400">
                    (Solo lectura)
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash
                    className={`h-5 w-5 ${
                      isEditing
                        ? "text-rose-500"
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
                                 ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 cursor-not-allowed"
                                 : "bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500"
                             }`}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-3 h-3" />
                <span>
                  Se agregará a Adds[5]. Ejemplos:{" "}
                  {examples.items.slice(0, 3).join(" • ") || "Cargando..."}
                </span>
              </div>
            </div>

            {/* Enhanced Description Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Descripción del Crimp B<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value.toUpperCase())}
                  placeholder="Ej. 10G-10FJX, 12GS-12FLH90M, 6G-6FFORX"
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

            {/* Enhanced Primary Measurements */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medidas Primarias (Opcionales)
                </h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Ruler className="w-4 h-4 text-green-500" />
                    Min
                  </label>
                  <input
                    value={minv}
                    onChange={(e) => setMinv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
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
                    Nom
                  </label>
                  <input
                    value={nom}
                    onChange={(e) => setNom(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
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
                    Max
                  </label>
                  <input
                    value={maxv}
                    onChange={(e) => setMaxv(numericFilter(e.target.value))}
                    inputMode="decimal"
                    pattern="^\d*\.?\d*$"
                    placeholder="0.00"
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
                  Configuración del Engaste (Opcionales)
                </h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {/* Curv Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Curv (Una letra)
                  </label>
                  <input
                    value={curv}
                    onChange={(e) =>
                      setCurv(e.target.value.slice(0, 1).toUpperCase())
                    }
                    placeholder="R"
                    maxLength={1}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase text-center text-2xl font-bold
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>
                      Ejemplos:{" "}
                      {examples.curvs.slice(0, 3).join(" • ") || "R, S, T"}
                    </span>
                  </div>
                </div>

                {/* Dies Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Wrench className="w-4 h-4 text-amber-500" />
                    Dies (Matrices)
                  </label>
                  <input
                    value={dies}
                    onChange={(e) => setDies(e.target.value.toUpperCase())}
                    placeholder="Ej. FP-22, FP-34, FP-37"
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
                      {examples.dies.slice(0, 3).join(" • ") || "Cargando..."}
                    </span>
                  </div>
                </div>

                {/* Crimp Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Cog className="w-4 h-4 text-rose-500" />
                    Tipo de Crimp
                  </label>
                  <input
                    value={crimp}
                    onChange={(e) => setCrimp(e.target.value.toUpperCase())}
                    placeholder="NORMAL"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500
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

            {/* Enhanced Secondary Measurements (O fields) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medidas Secundarias (Opcionales)
                </h3>
              </div>
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 mb-3">
                  <Target className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm font-medium">
                    Medidas adicionales para tolerancias específicas del segundo
                    engaste
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Ruler className="w-4 h-4 text-purple-500" />
                      NomO
                    </label>
                    <input
                      value={nomO}
                      onChange={(e) => setNomO(numericFilter(e.target.value))}
                      inputMode="decimal"
                      pattern="^\d*\.?\d*$"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                                 text-slate-900 dark:text-slate-100
                                 border-slate-200 dark:border-slate-700
                                 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
                                 transition-all duration-200 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Ruler className="w-4 h-4 text-pink-500" />
                      MaxO
                    </label>
                    <input
                      value={maxO}
                      onChange={(e) => setMaxO(numericFilter(e.target.value))}
                      inputMode="decimal"
                      pattern="^\d*\.?\d*$"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                                 text-slate-900 dark:text-slate-100
                                 border-slate-200 dark:border-slate-700
                                 focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500
                                 transition-all duration-200 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <Ruler className="w-4 h-4 text-red-500" />
                      MinO
                    </label>
                    <input
                      value={minO}
                      onChange={(e) => setMinO(numericFilter(e.target.value))}
                      inputMode="decimal"
                      pattern="^\d*\.?\d*$"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                                 text-slate-900 dark:text-slate-100
                                 border-slate-200 dark:border-slate-700
                                 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                                 transition-all duration-200 font-mono"
                    />
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
                           bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 text-white
                           hover:from-rose-500 hover:via-pink-500 hover:to-red-500
                           focus:outline-none focus:ring-4 focus:ring-rose-500/20
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
                    {isEditing ? "Actualizar Crimp B" : "Guardar Crimp B"}
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>

        {/* Enhanced Info Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-rose-500 text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">
              Información del Crimp B
            </h4>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0"></div>
              <span>
                El <strong>Item</strong> se agrega automáticamente como quinto
                elemento (<strong>Adds[5]</strong>) del Assembly al crear un
                nuevo registro.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0"></div>
              <span>
                Solo <strong>Item</strong> (al crear) y{" "}
                <strong>Description</strong> son obligatorios. Todos los demás
                campos son opcionales.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
              <span>
                Los campos <strong>Description</strong>, <strong>Dies</strong> y{" "}
                <strong>Crimp</strong> se convierten automáticamente a
                mayúsculas.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
              <span>
                Las <strong>medidas secundarias</strong> (MinO, NomO, MaxO) son
                para tolerancias específicas del segundo engaste.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
              <span>
                En modo edición, el campo <strong>Item</strong> es de solo
                lectura para mantener la integridad de los datos.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
