// src/app/assembly/[item]/packaging/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Package as PackageIcon,
  Info,
  AlertCircle,
  Edit3,
  Plus,
  Ruler,
  Hash,
  CheckCircle,
  Zap,
  Tag,
  Shield,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";
import GlobalTopbar from "@/components/GlobalTopbar";

export default function PackagingPage() {
  const router = useRouter();
  const params = useParams();

  const raw = Array.isArray(params?.item) ? params.item[0] : params?.item;
  const token = typeof raw === "string" ? raw.trim() : "";
  const assemblyItem = decodeItemId(token);

  const { showSuccess, showError, showWarning } = useAlert();

  const [isEditing, setIsEditing] = useState(false);

  //! ya no se captura item; solo se muestra (siempre = assemblyItem)
  //!    mantenemos el estado para el input de solo lectura
  const [item, setItem] = useState("");

  const [minv, setMinv] = useState("");
  const [nom, setNom] = useState("");
  const [maxv, setMaxv] = useState("");
  const [capA, setCapA] = useState("");
  const [capB, setCapB] = useState("");

  const [examples, setExamples] = useState({ capA: [], capB: [] }); //* quitamos examples.items
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

  async function loadData() {
    if (assemblyItem == null) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    try {
      const [rex, rcur] = await Promise.all([
        fetch("/api/packaging/examples", { cache: "no-store" }),
        fetch(`/api/packaging?assemblyItem=${assemblyItem}`, { cache: "no-store" }),
      ]);
      const dex = await rex.json();
      const dcur = await rcur.json();

      if (!rex.ok || !dex?.ok) throw new Error(dex?.error || "No se pudieron cargar ejemplos");
      setExamples({
        capA: dex.capA || [],
        capB: dex.capB || [],
      });

      if (!rcur.ok || !dcur?.ok) throw new Error(dcur?.error || "No se pudo obtener Packaging");
      if (dcur.packaging) {
        setIsEditing(true);
        //* el item mostrado SIEMPRE viene del assembly
        setItem(String(assemblyItem));
        setMinv(dcur.packaging.Min != null ? String(dcur.packaging.Min) : "");
        setNom(dcur.packaging.Nom != null ? String(dcur.packaging.Nom) : "");
        setMaxv(dcur.packaging.Max != null ? String(dcur.packaging.Max) : "");
        setCapA(dcur.packaging.CapA ?? "");
        setCapB(dcur.packaging.CapB ?? "");
      } else {
        setIsEditing(false);
        setItem(String(assemblyItem)); //* prellenar para mostrar
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
      const r = await fetch("/api/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assemblyItem,
          //! forzamos que el item del packaging sea el MISMO que el assembly
          item: isEditing ? null : Number(assemblyItem),
          min: minv === "" ? null : Number(minv),
          nom: nom === "" ? null : Number(nom),
          max: maxv === "" ? null : Number(maxv),
          capA: capA.trim() || null,
          capB: capB.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo guardar Packaging");

      showSuccess(`${isEditing ? "Packaging actualizado" : "Packaging guardado"}.`);
      setTimeout(() => backToNew(), 900);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  //! el formulario siempre es válido (ya no exigimos capturar item)
  const isFormValid = true;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-600 to-slate-600 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-600 to-slate-600 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">Cargando datos de Packaging…</p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">Preparando configuración de empaque</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      {/* Deco */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-gray-400/15 to-slate-600/15 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-slate-400/15 to-gray-600/15 blur-3xl"></div>
      </div>

      <GlobalTopbar
        title="Packaging"
        subtitle="Configuración de empaque y tapones"
        icon={PackageIcon}
        gradient="from-gray-600 via-slate-600 to-gray-700"
        containerMax="max-w-6xl"
        onBack={backToNew}
        rightExtra={
          <div className="flex items-center gap-3">
            {isEditing && (
              <div className="flex items-center gap-2 text-xs bg-gray-500/90 text-white px-3 py-2 rounded-lg border border-gray-400">
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

      <main className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="relative p-6 bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  {isEditing ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isEditing ? "Editar Packaging" : "Configurar Packaging"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditing ? "Modifica los parámetros de empaque" : "Define los parámetros de empaque y tapones"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-xs text-white/80 bg-white/15 px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>
                    El <b>Item</b> de Packaging será el mismo que el <b>Assembly</b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8">
            {/* Info Alert */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">
                  El <strong>Item</strong> es igual al del <strong>Assembly</strong> y no se puede editar.
                </p>
              </div>
            </div>

            {/* Item (solo lectura, ligado a assemblyItem) */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-500 to-slate-500"></div>
                Item del Packaging (solo lectura)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  value={item}
                  readOnly
                  disabled
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 text-slate-900 dark:text-slate-100
                             bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Medidas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Medidas de Empaque (Opcionales)</h3>
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
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Caps */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"></div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tapones y Protecciones (Opcionales)</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Shield className="w-4 h-4 text-orange-500" />
                    CapA (Protección A)
                  </label>
                  <input
                    value={capA}
                    onChange={(e) => setCapA(e.target.value.toUpperCase())}
                    placeholder="UN-9764, TS-17, TAPÓN INCLUIDO..."
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>Ejemplos: {examples.capA.slice(0, 3).join(" • ") || "Cargando..."}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Tag className="w-4 h-4 text-amber-500" />
                    CapB (Protección B)
                  </label>
                  <input
                    value={capB}
                    onChange={(e) => setCapB(e.target.value.toUpperCase())}
                    placeholder="UN-9764, TAPON INCLUIDO, PROTECTOR..."
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/50
                               text-slate-900 dark:text-slate-100 uppercase
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500
                               transition-all duration-200"
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3" />
                    <span>Ejemplos: {examples.capB.slice(0, 3).join(" • ") || "Cargando..."}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                disabled={loading || !isFormValid}
                type="submit"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl
                           bg-gradient-to-r from-gray-600 via-slate-600 to-gray-700 text-white
                           hover:from-gray-500 hover:via-slate-500 hover:to-gray-600
                           focus:outline-none focus:ring-4 focus:ring-gray-500/20
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
                    {isEditing ? "Actualizar Packaging" : "Guardar Packaging"}
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </>
                )}
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gray-500 text-white">
              <PackageIcon className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">Información del Packaging</h4>
          </div>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0"></div>
              <span>
                El <strong>Item</strong> de Packaging es el mismo <strong>Item</strong> del Assembly (proveniente de la URL).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0"></div>
              <span>
                En modo edición, el campo <strong>Item</strong> permanece en solo lectura.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
