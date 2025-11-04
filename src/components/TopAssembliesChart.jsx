"use client";

import { useEffect, useState } from "react";
import { Package2, TrendingUp, Loader2, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";

export default function TopByModuleChart() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("corte");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/top-by-module", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Error al cargar datos");
      setData(json.data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const barColors = [
    "from-[#470075] to-[#610891]",
    "from-[#610891] to-[#7d08c1]",
    "from-[#7d08c1] to-[#9503ed]",
    "from-[#9503ed] to-[#aa12ff]",
    "from-[#aa12ff] to-[#bb3dff]",
    "from-[#bb3dff] to-[#c966ff]",
    "from-[#c966ff] to-[#d68fff]",
    "from-[#d68fff] to-[#e3b8ff]",
    "from-[#e3b8ff] to-[#f0d9ff]",
    "from-[#f0d9ff] to-[#f8edff]",
  ];

  const textColors = [
    "text-white", "text-white", "text-white", "text-white", "text-white",
    "text-gray-900", "text-gray-900", "text-gray-900", "text-gray-900", "text-gray-900",
  ];

  const tabs = [
    { id: "corte", label: "Corte", icon: "🔪" },
    { id: "acabado", label: "Acabado", icon: "📦" },
    { id: "crimpA", label: "Crimp A", icon: "🔧" },
    { id: "crimpB", label: "Crimp B", icon: "🔩" },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#470075] to-[#aa12ff] flex items-center justify-center shadow-lg">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#470075] to-[#aa12ff] animate-pulse opacity-30"></div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Cargando Top 10 por Módulo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Error al cargar datos</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{error}</p>
            <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#470075] to-[#aa12ff] text-white text-sm font-medium hover:shadow-lg transition-all duration-200">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const currentData = data[activeTab]?.items || [];
  const maxQtyR = currentData.length > 0 ? Math.max(...currentData.map((item) => item.totalQtyR), 1) : 1;

  return (
    <div className="rounded-2xl border border-purple-200 dark:border-purple-900 overflow-hidden shadow-xl bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950 dark:to-slate-900 border-b border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#470075] to-[#aa12ff] text-white shadow-lg shadow-purple-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Top 10 por Módulo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Cantidad de piezas por tabla de producción</p>
            </div>
          </div>
          <button onClick={loadData} className="p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors hover:shadow-sm" title="Actualizar datos">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#470075] to-[#aa12ff] text-white shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                activeTab === tab.id
                  ? "bg-white/20"
                  : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              }`}>
                {data[tab.id]?.items?.length || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">No hay datos para {data[activeTab]?.name}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {currentData.map((item, index) => {
                const percentage = (item.totalQtyR / maxQtyR) * 100;

                return (
                  <div key={item.item} className="group relative p-3.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg transition-transform group-hover:scale-105 bg-gradient-to-br ${barColors[index]} ${textColors[index]}`}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                            <Package2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block truncate">Item #{item.item}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.totalRecords} registro{item.totalRecords !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1">
                          {item.totalQtyR.toLocaleString()}
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pzs</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="relative h-7 rounded-xl bg-purple-50 dark:bg-purple-950/20 overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm">
                      <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColors[index]} transition-all duration-1000 ease-out shadow-lg`} style={{ width: `${percentage}%` }}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className={`text-xs font-bold drop-shadow-md ${textColors[index]}`}>
                          {item.totalQtyR.toLocaleString()} piezas
                        </span>
                        <span className={`text-xs font-bold drop-shadow-md ${textColors[index]}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-xl px-4 py-2.5 shadow-2xl border border-purple-700 whitespace-nowrap">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${barColors[index]}`}></div>
                          <span className="font-bold">Posición #{index + 1}</span>
                        </div>
                        <div className="space-y-0.5 text-slate-300">
                          <div>📦 Item <span className="font-bold text-white">#{item.item}</span></div>
                          <div>💪 <span className="font-bold text-white">{item.totalQtyR.toLocaleString()}</span> piezas producidas</div>
                          <div>📊 <span className="font-bold text-white">{item.totalRecords}</span> registros</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-5 border-t border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#470075] to-[#aa12ff] text-white shadow-lg shadow-purple-500/20">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total en {data[activeTab]?.name}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Top 10 acumulado</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {currentData.reduce((sum, item) => sum + item.totalQtyR, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">piezas totales</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}