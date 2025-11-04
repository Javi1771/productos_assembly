"use client";

import { useEffect, useState } from "react";
import { Package2, TrendingUp, Loader2, RefreshCw, AlertCircle, Award } from "lucide-react";

/*
 * Versión COMPACTA del Top 10 Assemblies
 * Ideal para colocar al lado de otros componentes
 */
export default function TopAssembliesCompact() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/top-assemblies", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Error al cargar datos");
      }

      setData(json.topAssemblies || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const maxQtyR = data ? Math.max(...data.map((item) => item.totalQtyR), 1) : 1;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl p-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Cargando Top Assemblies...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl p-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {error || "Sin datos disponibles"}
          </p>
          {error && (
            <button
              onClick={loadData}
              className="mt-3 px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Top 10 Assemblies
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400">
                Por piezas realizadas
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            title="Actualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compact List */}
      <div className="p-4">
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = (item.totalQtyR / maxQtyR) * 100;
            const medals = ["🥇", "🥈", "🥉"];
            const medal = index < 3 ? medals[index] : null;

            return (
              <div
                key={item.item}
                className="group relative"
              >
                <div className="flex items-center gap-2 mb-1">
                  {/* Rank */}
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                    {medal || index + 1}
                  </div>

                  {/* Item */}
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <Package2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      #{item.item}
                    </span>
                  </div>

                  {/* Quantity */}
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {item.totalQtyR.toLocaleString()}
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div className="relative h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ml-7">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : index === 1
                        ? "bg-gradient-to-r from-slate-300 to-slate-400"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-400 to-amber-600"
                        : "bg-gradient-to-r from-indigo-500 to-violet-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Hover Info */}
                <div className="absolute -top-1 left-7 transform -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-slate-900 text-white text-[10px] rounded px-2 py-1 shadow-lg whitespace-nowrap">
                    {item.totalRecords} registros · {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-400">
              Total Top 10
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {data.reduce((sum, item) => sum + item.totalQtyR, 0).toLocaleString()} pzs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}