"use client";

import { useEffect, useState } from "react";
import { Package, Search, X, ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function JobsTable() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  async function loadJobs(page = 1, searchTerm = "") {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/jobs?${params}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Error al cargar jobs");
      }

      setJobs(data.jobs || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(currentPage, search);
  }, [currentPage, search]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Cargando jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 shadow-xl p-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Error al cargar datos</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{error}</p>
            <button
              onClick={() => loadJobs(currentPage, search)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Jobs Registrados</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Total: {pagination.total.toLocaleString()} registros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Folio, JOB, Item..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadJobs(currentPage, search)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">JOB</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Línea</th>
              <th className="px-4 py-3 text-center">Qty Total</th>
              <th className="px-4 py-3 text-center">Qty Real</th>
              <th className="px-4 py-3 text-center">Estatus</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {jobs.map((job) => (
              <tr key={job.folio} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {job.folio}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {job.job}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {job.item}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {job.linea}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {job.qtyTot.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-sm text-indigo-600 dark:text-indigo-400">
                    {job.qtyReal.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {job.estatus === true ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <XCircle className="w-3 h-3" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(job.fecha).toLocaleDateString("es-MX")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {search ? `No se encontraron resultados para "${search}"` : "No hay jobs registrados"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-slate-200 dark:border-slate-700 gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Mostrando {((currentPage - 1) * pagination.limit) + 1}-{Math.min(currentPage * pagination.limit, pagination.total)} de {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Página {currentPage} de {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}