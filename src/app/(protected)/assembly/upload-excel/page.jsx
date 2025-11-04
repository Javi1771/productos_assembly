"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileSpreadsheet, CheckCircle, Loader2, AlertCircle, FileCheck, Table, Calendar, Hash, FileText, Package } from "lucide-react";
import GlobalTopbar from "@/components/GlobalTopbar";
import { useAlert } from "@/components/AlertSystem";

export default function UploadExcelPage() {
  const router = useRouter();
  const { showError, showSuccess } = useAlert();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      showError("Por favor selecciona un archivo Excel válido (.xlsx o .xls)", "Archivo inválido");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError("Por favor selecciona un archivo primero", "Sin archivo");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/jobs/upload-excel", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error al subir el archivo");
      showSuccess(`Excel cargado exitosamente!\n\nRegistros procesados: ${data.inserted}\n${data.skipped > 0 ? `Registros omitidos: ${data.skipped}\n` : ""}${data.errors?.length > 0 ? `Errores: ${data.errors.length}` : ""}`, "Carga completada", 5000);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => router.push("/assembly/dashboard"), 2000);
    } catch (err) {
      console.error(err);
      showError(err.message || "Error al procesar el archivo", "Error");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/JOB_Vacio.xlsx";
    link.download = "JOB_Vacio.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { col: "A1", name: "Folio", icon: Hash, color: "from-blue-500 to-cyan-500", desc: "ID único" },
    { col: "B1", name: "JOB", icon: FileText, color: "from-violet-500 to-purple-500", desc: "Código trabajo" },
    { col: "C1", name: "Item", icon: Package, color: "from-pink-500 to-rose-500", desc: "Código item" },
    { col: "D1", name: "Linea", icon: Table, color: "from-orange-500 to-amber-500", desc: "Línea prod." },
    { col: "E1", name: "QtyTot", icon: Hash, color: "from-emerald-500 to-green-500", desc: "Cantidad total" },
    { col: "F1", name: "QtyReal", icon: Hash, color: "from-teal-500 to-cyan-500", desc: "Cantidad real" },
    { col: "G1", name: "Fecha", icon: Calendar, color: "from-indigo-500 to-blue-500", desc: "Fecha job" },
    { col: "H1", name: "Estatus", icon: CheckCircle, color: "from-fuchsia-500 to-pink-500", desc: "Estado 0/1" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-600/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-blue-400/10 to-cyan-600/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-purple-400/5 to-pink-600/5 blur-3xl"></div>
      </div>

      <GlobalTopbar 
        title="Cargar Jobs desde Excel" 
        subtitle="Importa registros masivos desde archivo Excel" 
        icon={FileSpreadsheet} 
        gradient="from-emerald-600 via-green-600 to-teal-600" 
        containerMax="max-w-7xl" 
        showBack={true} 
      />

      <main className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Steps - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md flex-shrink-0">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Paso 1</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Descargar Plantilla</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md flex-shrink-0">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Paso 2</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Subir Archivo</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-violet-200 dark:border-violet-900 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md flex-shrink-0">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Paso 3</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Procesar Datos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Download and Upload */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Download Template Card */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                    <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">Plantilla Excel</h3>
                    <p className="text-xs text-blue-100 truncate">Archivo vacío listo para usar</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
                  Descarga el archivo Excel con las columnas correctas. Solo llena los datos y súbelo.
                </p>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs sm:text-sm font-bold hover:from-blue-500 hover:to-cyan-500 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Descargar Excel Vacío</span>
                </button>
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <p className="text-xs font-bold text-blue-900 dark:text-blue-100">Información del archivo</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <span>8 columnas requeridas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <span>Formato: .xlsx o .xls</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <span>Encabezados en fila 1</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Card */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500 to-green-500 text-white">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
                    <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate">Subir Excel</h3>
                    <p className="text-xs text-emerald-100 truncate">Arrastra o selecciona tu archivo</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div 
                  onDragEnter={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDragOver={handleDrag} 
                  onDrop={handleDrop} 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
                    dragActive 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-105" 
                      : file 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                        : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
                  }`}
                >
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileInputChange} 
                    className="hidden" 
                  />
                  {file ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="relative inline-block">
                        <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-emerald-500" />
                        <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-emerald-500/20 animate-ping"></div>
                      </div>
                      <div className="px-2">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-1 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setFile(null); 
                          if (fileInputRef.current) fileInputRef.current.value = ""; 
                        }} 
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold active:scale-95 transition-transform"
                      >
                        ✕ Eliminar archivo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <FileSpreadsheet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-300 dark:text-slate-600" />
                      <div className="px-2">
                        <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-2">
                          Arrastra tu archivo aquí
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
                          o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-slate-400">
                          Formatos: .xlsx, .xls (máx. 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleUpload} 
                  disabled={!file || uploading} 
                  className="w-full mt-4 sm:mt-6 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs sm:text-sm font-bold hover:from-emerald-500 hover:to-green-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
                      <span className="truncate">Procesando archivo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">Subir y Procesar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Instructions */}
          <div className="lg:col-span-2">
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md flex-shrink-0">
                    <Table className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                      Columnas Requeridas
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      Información detallada de cada campo
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {/* Columns Grid - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {columns.map((col) => {
                    const Icon = col.icon;
                    return (
                      <div 
                        key={col.col} 
                        className="group relative p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-lg active:scale-95 sm:hover:scale-105"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${col.color} text-white shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 flex-shrink-0">
                                {col.col}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                                {col.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {col.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Important Instructions */}
                <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
                        📌 Instrucciones Importantes
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            Encabezados exactos en fila 1 (A1-H1)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            Datos empiezan en fila 2
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            Folio debe ser único
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            Fecha: YYYY-MM-DD o DD/MM/YYYY
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            Estatus: 0 (Inactivo) o 1 (Activo)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            QtyTot y QtyReal: números enteros
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Example Data Table */}
                <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4 sm:p-6">
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 flex-shrink-0" />
                    <span>Ejemplo de Datos</span>
                  </h4>
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="inline-block min-w-full">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800">
                            {columns.map(col => (
                              <th 
                                key={col.col} 
                                className="px-2 sm:px-3 py-2 text-left font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 whitespace-nowrap"
                              >
                                {col.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white dark:bg-slate-900">
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              1001
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              001
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              123
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              L01
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              100
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              95
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              15/12/2024
                            </td>
                            <td className="px-2 sm:px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              1
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}