"use client";

import { useEffect, useState } from "react";
import {  Package2,  BarChart2,  Users,  Layers,  Search, 
  Filter, TrendingUp, Activity, Plus, Edit, CheckCircle2, 
  AlertCircle, Loader2, RefreshCw, X, Hash, Building2, Target, 
  PieChart, BarChart3 } from "lucide-react";
import GlobalTopbar from "@/components/GlobalTopbar";
import InteractiveKPICard from "@/components/InteractiveKPICard";

const MODULES_ORDER = [
  { key: "hose", label: "Hose Cut", color: "bg-amber-500", shortLabel: "Hose" },
  { key: "sleeve", label: "Sleeve/Guard", color: "bg-blue-500", shortLabel: "Sleeve" },
  { key: "crimpA", label: "Crimp A", color: "bg-green-500", shortLabel: "CrimpA" },
  { key: "collarA", label: "Collar A", color: "bg-purple-500", shortLabel: "CollarA" },
  { key: "crimpB", label: "Crimp B", color: "bg-pink-500", shortLabel: "CrimpB" },
  { key: "collarB", label: "Collar B", color: "bg-teal-500", shortLabel: "CollarB" },
  { key: "packaging", label: "Packaging", color: "bg-slate-600", shortLabel: "Pack" },
];

//* Helper function to encode item ID like in the original code
function encodeItemId(itemId) {
  return btoa(itemId.toString()).replace(/[+/=]/g, match => 
    ({ '+': '-', '/': '_', '=': '' }[match])
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecents, setFilteredRecents] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard/summary", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "No se pudo cargar el dashboard");
      setData(d);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (data?.recents) {
      let filtered = data.recents.filter(item => 
        item.item.toString().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nci.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerRev.toLowerCase().includes(searchTerm.toLowerCase())
      );

      //* Aplicar filtro de completitud
      if (selectedFilter === "complete") {
        filtered = filtered.filter(item => 
          MODULES_ORDER.every(module => item.modules[module.key])
        );
      } else if (selectedFilter === "incomplete") {
        filtered = filtered.filter(item => 
          !MODULES_ORDER.every(module => item.modules[module.key])
        );
      }

      setFilteredRecents(filtered);
      setCurrentPage(1); //* Resetear a la primera página al cambiar filtros
    }
  }, [data, searchTerm, selectedFilter]);

  //* Cálculo de paginación
  const totalPages = Math.ceil(filteredRecents.length / itemsPerPage);
  const paginatedRecents = filteredRecents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

const handleEditAssembly = (item) => {
  const token = encodeItemId(item);
  window.location.href = `/assembly/new?edit=1&item=${encodeURIComponent(token)}`;
};


  const getModuleCompletionCount = (modules) => {
    return MODULES_ORDER.reduce((count, module) => 
      count + (modules[module.key] ? 1 : 0), 0
    );
  };

  const getCompletionStatus = (count) => {
    const percentage = (count / MODULES_ORDER.length) * 100;
    if (percentage === 100) return { 
      color: "text-emerald-600", 
      bg: "bg-emerald-50 dark:bg-emerald-950/20", 
      border: "border-emerald-200 dark:border-emerald-800",
      label: "Completo",
      icon: "🎯"
    };
    if (percentage >= 70) return { 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-950/20", 
      border: "border-blue-200 dark:border-blue-800",
      label: "Avanzado",
      icon: "⚡"
    };
    if (percentage >= 40) return { 
      color: "text-amber-600", 
      bg: "bg-amber-50 dark:bg-amber-950/20", 
      border: "border-amber-200 dark:border-amber-800",
      label: "En progreso",
      icon: "🔄"
    };
    return { 
      color: "text-red-600", 
      bg: "bg-red-50 dark:bg-red-950/20", 
      border: "border-red-200 dark:border-red-800",
      label: "Inicial",
      icon: "🔴"
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 grid place-items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Cargando dashboard…
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-1">
            Analizando datos del sistema
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-950 dark:via-red-950 dark:to-rose-950 grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 text-center shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Error de Conexión
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-6">
            No se pudo cargar la información del dashboard.
          </p>
          <button 
            onClick={load} 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { totals, perModule, topCustomers, recents } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-600/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/10 to-cyan-600/10 blur-3xl"></div>
      </div>

      {/* Using GlobalTopbar */}
      <GlobalTopbar
        title="Dashboard de Assembly"
        subtitle="Panel de control y gestión de productos"
        icon={BarChart2}
        gradient="from-indigo-600 via-violet-600 to-purple-600"
        containerMax="max-w-7xl"
        showBack={true}
        rightExtra={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-white/15 border border-white/20 px-3 py-2 rounded-lg backdrop-blur-sm">
              <Activity className="w-4 h-4" />
              <span>Sistema activo</span>
            </div>
          </div>
        }
        newButton={{
          label: "Nuevo Assembly",
          onClick: () => window.location.href = "/assembly/new",
          icon: Plus,
        }}
      />

      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Interactive KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InteractiveKPICard
            title="Total Assemblies"
            value={totals.assemblies}
            icon={Package2}
            gradient="from-indigo-500 to-violet-500"
            data={data}
            type="total"
          />
          <InteractiveKPICard
            title="Con Módulos"
            value={totals.withAny}
            icon={CheckCircle2}
            gradient="from-emerald-500 to-green-500"
            data={data}
            type="withModules"
            percentage={((totals.withAny / totals.assemblies) * 100).toFixed(1)}
          />
          <InteractiveKPICard
            title="Completos"
            value={totals.fullyCompleted}
            icon={Target}
            gradient="from-amber-500 to-orange-500"
            data={data}
            type="complete"
            percentage={((totals.fullyCompleted / totals.assemblies) * 100).toFixed(1)}
          />
          <InteractiveKPICard
            title="Promedio Módulos"
            value={totals.avgModulesPerAssembly}
            icon={TrendingUp}
            gradient="from-blue-500 to-cyan-500"
            data={data}
            type="average"
            suffix=" / 7"
          />
        </section>

        {/* Enhanced Module Coverage */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="p-6 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Cobertura por Módulo
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Distribución de configuraciones por tipo de módulo
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES_ORDER.map((m) => {
              const pm = perModule[m.key];
              const pct = pm?.percent ?? 0;
              return (
                <div key={m.key} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full ${m.color}`}></div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {pm?.label || m.label}
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>{pm?.count || 0}/{totals.assemblies}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-2 ${m.color} transition-all duration-500 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {pct > 0 ? `${pct}% de assemblies` : 'Sin configurar'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Top Customers */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="p-5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Top Clientes
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Principales por volumen
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {topCustomers.map((c, index) => (
                  <div
                    key={c.customer}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {c.customer}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {c.count}
                    </div>
                  </div>
                ))}
                {!topCustomers.length && (
                  <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400">
                    No hay datos de clientes disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Recent Assemblies */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="p-5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      Assemblies Recientes
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Últimos registros ordenados por Item
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar Item, descripción, cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {/* Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-lg border transition-colors ${
                        showFilters || selectedFilter !== "all"
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    {showFilters && (
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-10">
                        <div className="p-2">
                          <button
                            onClick={() => {setSelectedFilter("all"); setShowFilters(false);}}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              selectedFilter === "all" 
                                ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            Todos los assemblies
                          </button>
                          <button
                            onClick={() => {setSelectedFilter("complete"); setShowFilters(false);}}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              selectedFilter === "complete" 
                                ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            Solo completos (7/7)
                          </button>
                          <button
                            onClick={() => {setSelectedFilter("incomplete"); setShowFilters(false);}}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              selectedFilter === "incomplete" 
                                ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            Incompletos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-3 py-3 w-20 min-w-[80px]">Item</th>
                    <th className="px-3 py-3 min-w-[200px]">Descripción</th>
                    <th className="px-3 py-3 w-24 min-w-[100px]">Cliente</th>
                    <th className="px-3 py-3 w-20 min-w-[80px]">NCI</th>
                    <th className="px-3 py-3 w-32 min-w-[120px] text-center">Estado</th>
                    <th className="px-3 py-3 w-48 min-w-[180px] text-center">Módulos</th>
                    <th className="px-3 py-3 w-20 min-w-[80px] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedRecents.map((r) => {
                    const completedCount = getModuleCompletionCount(r.modules);
                    const status = getCompletionStatus(completedCount);
                    const completionPercentage = Math.round((completedCount / MODULES_ORDER.length) * 100);
                    
                    return (
                      <tr key={r.item} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {r.item}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                            {r.description}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {r.customer}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
                            {r.nci}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${status.color} ${status.bg} ${status.border} inline-flex items-center gap-1 whitespace-nowrap`}>
                              <span className="text-xs">{status.icon}</span>
                              <span>{status.label}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {completionPercentage}%
                              </span>
                              <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                                  style={{ width: `${completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-0.5">
                              {MODULES_ORDER.map((m, index) => (
                                <div
                                  key={m.key}
                                  className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] font-bold transition-all duration-200 ${
                                    r.modules[m.key]
                                      ? `${m.color} border-white text-white shadow-sm`
                                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400"
                                  } ${index < 6 ? 'mr-0.5' : ''}`}
                                  title={`${m.shortLabel}: ${r.modules[m.key] ? 'Configurado' : 'Sin configurar'}`}
                                >
                                  {r.modules[m.key] ? "✓" : m.shortLabel.charAt(0)}
                                </div>
                              ))}
                              <span className="text-xs text-slate-500 ml-2 font-medium whitespace-nowrap">
                                {completedCount}/7
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleEditAssembly(r.item)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 opacity-70 group-hover:opacity-100 whitespace-nowrap"
                            title="Editar assembly"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-slate-200 dark:border-slate-700 gap-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span>Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRecents.length)} de {filteredRecents.length} registros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage <= 2) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNum = totalPages - 2 + i;
                        } else {
                          pageNum = currentPage - 1 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {totalPages > 3 && currentPage < totalPages - 1 && (
                        <>
                          <span className="text-slate-400 px-1">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 rounded text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
              
              {filteredRecents.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {searchTerm ? "No se encontraron resultados" : "No hay registros disponibles"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {searchTerm 
                      ? `No se encontraron assemblies que coincidan con "${searchTerm}"`
                      : "Aún no hay assemblies registrados en el sistema"
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200 text-sm font-medium transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Stats Summary */}
        {data && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                Resumen del Sistema
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {((totals.withAny / totals.assemblies) * 100).toFixed(1)}%
                  </strong>{" "}
                  de los assemblies tienen al menos un módulo configurado
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0"></div>
                <span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {((totals.fullyCompleted / totals.assemblies) * 100).toFixed(1)}%
                  </strong>{" "}
                  de los assemblies están completamente configurados
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <span>
                  En promedio, cada assembly tiene{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {totals.avgModulesPerAssembly}
                  </strong>{" "}
                  módulos de los {MODULES_ORDER.length} disponibles
                </span>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}