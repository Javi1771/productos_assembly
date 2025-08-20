// src/app/assembly/[item]/hose/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2, Scissors } from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import { decodeItemId } from "@/lib/idCodec";

export default function HoseCutPage() {
  const router = useRouter();
  const params = useParams();

  // leer el segmento [item] de la ruta (token base64-url)
  const rawParam = Array.isArray(params?.item) ? params.item[0] : params?.item;
  const token = typeof rawParam === "string" ? rawParam.trim() : "";
  const assemblyItem = decodeItemId(token);

  const { showSuccess, showError, showWarning } = useAlert();

  const [item, setItem] = useState("");          // Item Hose (irá a Adds[0])
  const [description, setDescription] = useState("");
  const [minv, setMinv] = useState("");
  const [maxv, setMaxv] = useState("");
  const [nom, setNom] = useState("");
  const [clea, setClea] = useState("");

  const [examples, setExamples] = useState({ items: [], descriptions: [], cleas: [] });
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // <-- si ya hay Hose guardado

  // Volver a la pantalla anterior con el assembly activo
  const backToNew = () => {
    if (!token) return router.replace("/assembly/new");
    router.replace(`/assembly/new?last=${encodeURIComponent(token)}#opcionales`);
  };

  // Permitir solo números (y un punto) para Min/Nom/Max
  const numericFilter = (raw) => {
    let v = (raw || "").replace(/,/g, ".");     // admitir coma como punto
    v = v.replace(/[^\d.]/g, "");               // solo dígitos y puntos
    const i = v.indexOf(".");
    if (i !== -1) {
      // permitir solo un punto decimal
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
      // Cargar ejemplos y (si existe) el Hose ligado al assembly
      const [rex, rcur] = await Promise.all([
        fetch("/api/hose/examples", { cache: "no-store" }),
        fetch(`/api/hose?assemblyItem=${assemblyItem}`, { cache: "no-store" }),
      ]);
      const dex = await rex.json();
      const dcur = await rcur.json();

      if (!rex.ok || !dex?.ok) throw new Error(dex?.error || "No se pudieron cargar ejemplos");
      setExamples({
        items: dex.items || [],
        descriptions: dex.descriptions || [],
        cleas: dex.cleas || [],
      });

      if (!rcur.ok || !dcur?.ok) throw new Error(dcur?.error || "No se pudo obtener Hose");

      if (dcur.hose) {
        // Modo edición: prellenar y bloquear Item
        setIsEditing(true);
        setItem(String(dcur.hose.Item ?? "")); // Item no editable en edición
        setDescription(dcur.hose.Description ?? "");
        setMinv(dcur.hose.Min != null ? String(dcur.hose.Min) : "");
        setNom(dcur.hose.Nom != null ? String(dcur.hose.Nom) : "");
        setMaxv(dcur.hose.Max != null ? String(dcur.hose.Max) : "");
        setClea(dcur.hose.Clea ?? "");
      } else {
        // Nuevo: sin bloqueo de Item
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
          item: Number(item),                    // aunque esté bloqueado en edición, se envía
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
        `${isEditing ? "Hose actualizado" : "Hose guardado"} (Item ${d.hose.item}). Adds actualizado en Assembly #${d.assembly.item}`
      );

      // Regresar a la pantalla anterior con el assembly activo
      setTimeout(() => backToNew(), 900);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (assemblyItem == null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Token de Assembly inválido o ausente.</p>
          <button
            onClick={() => router.replace("/assembly/new")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Volver a crear Assembly
          </button>
        </div>
      </div>
    );
  }

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Topbar con degradado */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={backToNew}
              className="px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 border border-white/20"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Volver
              </span>
            </button>
            <h1 className="text-lg font-semibold inline-flex items-center gap-2">
              <span className="w-6 h-6 rounded-md grid place-items-center bg-white/15">
                <Scissors className="w-4 h-4" />
              </span>
              Hose Cut
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-400/90 text-slate-900 border border-amber-300">
                Editando existente
              </span>
            )}
            <span className="text-xs bg-white/15 border border-white/20 px-2 py-1 rounded-md">
              Assembly: <b>#{assemblyItem}</b>
            </span>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
          {/* Header card con degradado sutil */}
          <div className="p-5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Datos de Hose</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isEditing ? "Edita los datos y guarda." : "Completa la información y guarda."}
                </p>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Primer segmento de <b>Adds</b> se actualizará con <b>Item</b>.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6">
            {/* Item (bloqueado en edición) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Item (aparecerá en Adds)
              </label>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="Ej. 788828"
                required
                readOnly={isEditing}
                className={`w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                           text-slate-900 dark:text-slate-100
                           border-slate-300 dark:border-slate-700
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                           ${isEditing ? "opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20" : ""}`}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Ejemplos recientes: {examples.items.slice(0, 3).join(" • ") || "—"}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Corte de manguera TF-A"
                required
                className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                           text-slate-900 dark:text-slate-100
                           border-slate-300 dark:border-slate-700
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Ejemplos: {examples.descriptions.slice(0, 3).join(" • ") || "—"}
              </p>
            </div>

            {/* Min / Nom / Max (solo números/decimal) */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Min</label>
                <input
                  value={minv}
                  onChange={(e) => setMinv(numericFilter(e.target.value))}
                  inputMode="decimal"
                  placeholder="0.00"
                  pattern="^\d*\.?\d*$"
                  className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100
                             border-slate-300 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label>
                <input
                  value={nom}
                  onChange={(e) => setNom(numericFilter(e.target.value))}
                  inputMode="decimal"
                  placeholder="0.00"
                  pattern="^\d*\.?\d*$"
                  className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100
                             border-slate-300 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max</label>
                <input
                  value={maxv}
                  onChange={(e) => setMaxv(numericFilter(e.target.value))}
                  inputMode="decimal"
                  placeholder="0.00"
                  pattern="^\d*\.?\d*$"
                  className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100
                             border-slate-300 dark:border-slate-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Clea */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Clea</label>
              <input
                value={clea}
                onChange={(e) => setClea(e.target.value)}
                placeholder="Texto libre"
                className="w-full px-3 py-2 rounded-md border bg-white dark:bg-slate-950/40
                           text-slate-900 dark:text-slate-100
                           border-slate-300 dark:border-slate-700
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Ejemplos: {examples.cleas.slice(0, 3).join(" • ") || "—"}
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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditing ? "Actualizar Hose" : "Guardar Hose"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
