"use client";

import React, { useState, useId } from "react";
import { 
  ArrowUpRight, 
  X, 
  BarChart3, 
  Info
} from "lucide-react";

const InteractiveKPICard = ({ title, value, icon: Icon, gradient, data, type, percentage, suffix = "" }) => {
  const [showModal, setShowModal] = useState(false);
  const uniqueId = useId(); //* Generar ID único para gradientes SVG

  const getDetailedData = () => {
    switch (type) {
      case "total":
        return {
          title: "Total de Assemblies",
          description: "Todos los assemblies registrados en el sistema",
          chart: "bar",
          details: [
            { label: "Assemblies activos", value: data.totals.assemblies, color: "text-indigo-600" },
            { label: "Con módulos configurados", value: data.totals.withAny, color: "text-emerald-600" },
            { label: "Sin módulos", value: data.totals.assemblies - data.totals.withAny, color: "text-slate-500" },
          ],
          insights: [
            `${data.totals.assemblies} assemblies totales en el sistema`,
            `${((data.totals.withAny / data.totals.assemblies) * 100).toFixed(1)}% tienen al menos un módulo configurado`,
            `${data.totals.assemblies - data.totals.withAny} assemblies están pendientes de configuración`
          ]
        };
      
      case "withModules":
        return {
          title: "Assemblies con Módulos",
          description: "Assemblies que tienen al menos un módulo configurado",
          chart: "pie",
          details: [
            { label: "Con módulos", value: data.totals.withAny, color: "text-emerald-600" },
            { label: "Sin módulos", value: data.totals.assemblies - data.totals.withAny, color: "text-red-500" },
            { label: "Porcentaje activo", value: `${percentage}%`, color: "text-blue-600" },
          ],
          insights: [
            `${data.totals.withAny} de ${data.totals.assemblies} assemblies tienen configuración`,
            `${percentage}% de adopción en el sistema`,
            `${data.totals.assemblies - data.totals.withAny} assemblies necesitan configuración`
          ]
        };
      
      case "complete":
        return {
          title: "Assemblies Completos",
          description: "Assemblies con los 7 módulos configurados",
          chart: "progress",
          details: [
            { label: "Completos (7/7)", value: data.totals.fullyCompleted, color: "text-emerald-600" },
            { label: "Parciales", value: data.totals.withAny - data.totals.fullyCompleted, color: "text-amber-600" },
            { label: "Sin configurar", value: data.totals.assemblies - data.totals.withAny, color: "text-red-500" },
          ],
          insights: [
            `${data.totals.fullyCompleted} assemblies están 100% configurados`,
            `${percentage}% de los assemblies están completos`,
            `${data.totals.withAny - data.totals.fullyCompleted} assemblies están parcialmente configurados`
          ]
        };
      
      case "average":
        return {
          title: "Promedio de Módulos",
          description: "Número promedio de módulos por assembly",
          chart: "gauge",
          details: [
            { label: "Promedio actual", value: data.totals.avgModulesPerAssembly, color: "text-blue-600" },
            { label: "Máximo posible", value: "7", color: "text-slate-600" },
            { label: "Eficiencia", value: `${((data.totals.avgModulesPerAssembly / 7) * 100).toFixed(1)}%`, color: "text-indigo-600" },
          ],
          insights: [
            `Promedio de ${data.totals.avgModulesPerAssembly} módulos por assembly`,
            `${((data.totals.avgModulesPerAssembly / 7) * 100).toFixed(1)}% de utilización de módulos`,
            `Potencial de ${(7 - data.totals.avgModulesPerAssembly).toFixed(1)} módulos adicionales por assembly`
          ]
        };
      
      default:
        return null;
    }
  };

  const renderChart = (chartData) => {
    const maxValue = Math.max(...chartData.details.map(d => typeof d.value === 'string' ? parseFloat(d.value) || 0 : d.value));
    
    switch (chartData.chart) {
      case "bar":
        return (
          <div className="space-y-4">
            {chartData.details.map((detail, index) => {
              const numValue = typeof detail.value === 'string' ? parseFloat(detail.value) || 0 : detail.value;
              const percentage = (numValue / maxValue) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {detail.label}
                    </span>
                    <span className={`text-sm font-bold ${detail.color}`}>
                      {detail.value}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      
      case "pie":
        const total = chartData.details.slice(0, 2).reduce((sum, d) => sum + (typeof d.value === 'string' ? parseFloat(d.value) || 0 : d.value), 0);
        const firstValue = typeof chartData.details[0].value === 'string' ? parseFloat(chartData.details[0].value) || 0 : chartData.details[0].value;
        const angle = (firstValue / total) * 360;
        
        return (
          <div className="flex items-center justify-center space-x-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={`url(#pie-gradient-${uniqueId})`}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(angle / 360) * 251.2} 251.2`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id={`pie-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {chartData.details.slice(0, 2).map((detail, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {detail.label}
                    </div>
                    <div className={`text-lg font-bold ${detail.color}`}>
                      {detail.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "progress":
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-slate-200 dark:text-slate-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={`url(#progress-gradient-${uniqueId})`}
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${(parseFloat(percentage) / 100) * 282.6} 282.6`}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id={`progress-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {percentage}%
                  </span>
                  <span className="text-xs text-slate-500">completos</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {chartData.details.map((detail, index) => (
                <div key={index} className="text-center">
                  <div className={`text-lg font-bold ${detail.color}`}>
                    {detail.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {detail.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "gauge":
        const gaugePercentage = (parseFloat(data.totals.avgModulesPerAssembly) / 7) * 100;
        
        return (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="w-80 space-y-6">
                {/* Main metric display */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {data.totals.avgModulesPerAssembly}
                  </div>
                  <div className="text-lg text-slate-500 dark:text-slate-400 mb-1">
                    promedio de 7 módulos
                  </div>
                  <div className="text-sm text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full inline-block">
                    {gaugePercentage.toFixed(1)}% utilización
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>0 módulos</span>
                    <span>7 módulos</span>
                  </div>
                  <div className="relative">
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${gaugePercentage}%` }}
                      />
                    </div>
                    {/* Value indicator */}
                    <div 
                      className="absolute top-0 h-4 w-1 bg-white shadow-md rounded-full transform -translate-x-0.5"
                      style={{ left: `${gaugePercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Mínimo</span>
                    <span className="font-medium text-blue-600">
                      Promedio actual: {data.totals.avgModulesPerAssembly}
                    </span>
                    <span>Máximo</span>
                  </div>
                </div>
                
                {/* Module breakdown visualization */}
                <div className="grid grid-cols-7 gap-1 mt-6">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className={`w-full h-8 rounded border-2 transition-all duration-300 ${
                          i < Math.floor(parseFloat(data.totals.avgModulesPerAssembly))
                            ? 'bg-gradient-to-t from-blue-500 to-cyan-500 border-blue-400'
                            : i === Math.floor(parseFloat(data.totals.avgModulesPerAssembly))
                            ? 'bg-gradient-to-t from-blue-300 to-cyan-300 border-blue-300 opacity-60'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                        }`}
                      />
                      <div className="text-xs text-slate-400 mt-1">{i + 1}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-xs text-slate-500">
                  Representación visual por módulo
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {chartData.details.map((detail, index) => (
                <div key={index} className="text-center">
                  <div className={`text-lg font-bold ${detail.color}`}>
                    {detail.value}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {detail.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const detailedData = getDetailedData();

  return (
    <>
      <div className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
           onClick={() => setShowModal(true)}>
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
            <Icon className="w-5 h-5" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          {title}
        </div>
        {percentage && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-1.5 bg-gradient-to-r ${gradient} transition-all duration-500`}
                style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">{percentage}%</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && detailedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className={`p-6 bg-gradient-to-r ${gradient} text-white rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{detailedData.title}</h3>
                    <p className="text-white/90 text-sm mt-1">{detailedData.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Chart Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Visualización de Datos
                </h4>
                {renderChart(detailedData)}
              </div>

              {/* Insights Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Información Detallada
                </h4>
                <div className="grid gap-3">
                  {detailedData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InteractiveKPICard;