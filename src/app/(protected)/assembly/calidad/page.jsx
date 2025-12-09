"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserRoleFromCookie } from "@/utils/cookies";
import {
  CheckCircle2,
  Save,
  Loader2,
  Sparkles,
  ClipboardCheck,
  PackageCheck,
  AlertTriangle,
  Scissors,
  Wrench,
  LogOut,
  Info,
  Trash2,
  PlusCircle,
  BarChart2,
  XCircle,
} from "lucide-react";
import { useAlert } from "@/components/AlertSystem";
import GlobalTopbar from "@/components/GlobalTopbar";

export default function CalidadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { showSuccess, showError, showWarning } = useAlert();

  //* Estado del formulario principal
  const [formData, setFormData] = useState({
    longitudRealVSDibujo: "",
    anguloOrientacion: "",
    diametroCrimpA: "",
    diametroCrimpB: "",
    longitudTotalVSDibujo: "",
    tipoManga: 0, //* 0=Cumple, 1=No cumple, 2=No aplica
    descripcionManga: "",
    tipoManguera: 0,
    descripcionManguera: "",
    metodoEmpaque: 0,
    cliente: "",
    cortadoraAjustada: false,
    descripcionDibujo: "",
    etiquetaA: "",
    etiquetaB: "",
    cintas: false,
    scrap: false,
    sobrante: false,
  });

  //* Estados para las tablas relacionadas
  const [cintas, setCintas] = useState([
    { numeroCinta: 1, longitud: "", color: "" },
    { numeroCinta: 2, longitud: "", color: "" },
    { numeroCinta: 3, longitud: "", color: "" },
    { numeroCinta: 4, longitud: "", color: "" },
    { numeroCinta: 5, longitud: "", color: "" },
    { numeroCinta: 6, longitud: "", color: "" },
    { numeroCinta: 7, longitud: "", color: "" },
  ]);

  const [scrapItems, setScrapItems] = useState([{ cantidad: "", codigo: "" }]);
  const [materialSobrante, setMaterialSobrante] = useState([
    { itemSobrante: "", cantidad: "", motivoRetorno: "" },
  ]);

  //* Verificar autenticación y rol
  useEffect(() => {
    setMounted(true);
    const role = getUserRoleFromCookie();

    if (!role) {
      router.push("/login");
      return;
    }

    if (role === "3") {
      showWarning("Los operadores no tienen acceso al sistema web");
      router.push("/login");
      return;
    }

    setUserRole(role === "1" ? "Administrator" : role === "2" ? "Quality" : "Unknown");
  }, [router, showWarning]);

  const isAdmin = mounted && userRole === "Administrator";
  const isCalidad = mounted && userRole === "Quality";

  //* Manejadores de cambio
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCintaChange = (index, field, value) => {
    const newCintas = [...cintas];
    newCintas[index][field] = value;
    setCintas(newCintas);
  };

  const handleScrapChange = (index, field, value) => {
    const newScrap = [...scrapItems];
    newScrap[index][field] = value;
    setScrapItems(newScrap);
  };

  const addScrapRow = () => {
    setScrapItems([...scrapItems, { cantidad: "", codigo: "" }]);
  };

  const removeScrapRow = (index) => {
    if (scrapItems.length > 1) {
      setScrapItems(scrapItems.filter((_, i) => i !== index));
    }
  };

  const handleSobranteChange = (index, field, value) => {
    const newSobrante = [...materialSobrante];
    newSobrante[index][field] = value;
    setMaterialSobrante(newSobrante);
  };

  const addSobranteRow = () => {
    setMaterialSobrante([...materialSobrante, { itemSobrante: "", cantidad: "", motivoRetorno: "" }]);
  };

  const removeSobranteRow = (index) => {
    if (materialSobrante.length > 1) {
      setMaterialSobrante(materialSobrante.filter((_, i) => i !== index));
    }
  };

  //* Función para limpiar sin preguntar (usada después de guardar)
  const clearFormSilently = () => {
    setFormData({
      longitudRealVSDibujo: "",
      anguloOrientacion: "",
      diametroCrimpA: "",
      diametroCrimpB: "",
      longitudTotalVSDibujo: "",
      tipoManga: 0,
      descripcionManga: "",
      tipoManguera: 0,
      descripcionManguera: "",
      metodoEmpaque: 0,
      cliente: "",
      cortadoraAjustada: false,
      descripcionDibujo: "",
      etiquetaA: "",
      etiquetaB: "",
      cintas: false,
      scrap: false,
      sobrante: false,
    });
    setCintas([
      { numeroCinta: 1, longitud: "", color: "" },
      { numeroCinta: 2, longitud: "", color: "" },
      { numeroCinta: 3, longitud: "", color: "" },
      { numeroCinta: 4, longitud: "", color: "" },
      { numeroCinta: 5, longitud: "", color: "" },
      { numeroCinta: 6, longitud: "", color: "" },
      { numeroCinta: 7, longitud: "", color: "" },
    ]);
    setScrapItems([{ cantidad: "", codigo: "" }]);
    setMaterialSobrante([{ itemSobrante: "", cantidad: "", motivoRetorno: "" }]);
  };

  //* Función para limpiar el formulario CON CONFIRMACIÓN (solo cuando se presiona el botón)
  const handleClear = () => {
    // *Crear un modal personalizado en lugar de usar confirm()
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    modal.style.backdropFilter = 'blur(8px)';
    
    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full overflow-hidden transform scale-95 animate-scale-in">
        <div class="relative p-6 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Confirmar limpieza</h3>
              <p class="text-red-200 text-sm mt-1">Esta acción no se puede deshacer</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <p class="text-slate-300 text-center mb-6">¿Estás seguro de que deseas limpiar todos los campos del formulario?</p>
          <div class="flex gap-3">
            <button id="modal-cancel" class="flex-1 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all transform hover:scale-105">
              Cancelar
            </button>
            <button id="modal-accept" class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold transition-all transform hover:scale-105 shadow-lg">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    //* Animación de entrada
    requestAnimationFrame(() => {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 200ms';
      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });
    });
    
    const handleAccept = () => {
      clearFormSilently();
      document.body.removeChild(modal);
    };
    
    const handleCancel = () => {
      modal.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(modal);
      }, 200);
    };
    
    document.getElementById('modal-accept').addEventListener('click', handleAccept);
    document.getElementById('modal-cancel').addEventListener('click', handleCancel);
    
    //* Cerrar al hacer click fuera del modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) handleCancel();
    });
  };

  //* Función para registrar calidad
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        cintas: formData.cintas ? cintas.filter((c) => c.longitud || c.color) : [],
        scrap: formData.scrap ? scrapItems.filter((s) => s.cantidad || s.codigo) : [],
        sobrante: formData.sobrante ? materialSobrante.filter((m) => m.itemSobrante || m.cantidad) : [],
      };

      const response = await fetch("/api/calidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess("Registro de calidad guardado exitosamente");
        //* Limpiar automáticamente sin preguntar
        clearFormSilently();
      } else {
        showError(result.error || "Error al guardar el registro");
      }
    } catch (error) {
      console.error("Error:", error);
      showError("Error al guardar el registro de calidad");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-pulse opacity-50"></div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Cargando sistema de calidad…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-600/10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/10 to-cyan-600/10 blur-3xl"></div>
      </div>

      <GlobalTopbar
        title="Control de Calidad"
        subtitle="Inspección y validación de ensambles"
        icon={ClipboardCheck}
        gradient="from-red-900 via-red-700 to-red-600"
        showBack={true}
        rightExtra={
          <div className="flex items-center gap-3">
            {(isCalidad || isAdmin) && (
              <button
                onClick={() => router.push("/assembly/dashboard")}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                title="Ver Dashboard"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">Dashboard</span>
                </span>
              </button>
            )}

            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.replace("/login");
              }}
              className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
              title="Cerrar sesión"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Cerrar sesión</span>
              </span>
            </button>
          </div>
        }
      />

      {/* Formulario principal */}
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN: Mediciones */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Mediciones de Control</h2>
                  <p className="text-white/90 text-sm">Verifica las dimensiones críticas del ensamble</p>
                </div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                  Longitud real de corte Vs dibujo
                </label>
                <input
                  type="text"
                  name="longitudRealVSDibujo"
                  value={formData.longitudRealVSDibujo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Ej. 1250mm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                  Medición real de ángulo orientación
                </label>
                <input
                  type="text"
                  name="anguloOrientacion"
                  value={formData.anguloOrientacion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Ej. 45°"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                  Medición de diámetro real Crimpado A
                </label>
                <input
                  type="text"
                  name="diametroCrimpA"
                  value={formData.diametroCrimpA}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Ej. 25.4mm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                  Medición de diámetro real Crimpado B
                </label>
                <input
                  type="text"
                  name="diametroCrimpB"
                  value={formData.diametroCrimpB}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Ej. 32mm"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                  Medición de longitud total real Vs dibujo
                </label>
                <input
                  type="text"
                  name="longitudTotalVSDibujo"
                  value={formData.longitudTotalVSDibujo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Ej. 3200mm"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: Tipo de Manga */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Tipo de manga correcta conforme a dibujo y JOB/BOM</h2>
                  <p className="text-white/90 text-sm">Verificación del componente según especificaciones</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex flex-wrap gap-6">
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManga"
                    value="0"
                    checked={formData.tipoManga === 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManga: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Cumple
                  </span>
                </label>
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManga"
                    value="1"
                    checked={formData.tipoManga === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManga: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-red-600 focus:ring-red-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    No cumple
                  </span>
                </label>
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManga"
                    value="2"
                    checked={formData.tipoManga === 2}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManga: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-slate-600 focus:ring-slate-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    No aplica
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
                  Descripción del componente
                </label>
                <input
                  type="text"
                  name="descripcionManga"
                  value={formData.descripcionManga}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Describe el componente observado"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: Tipo de Manguera */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Tipo de manguera correcta conforme a dibujo y JOB/BOM</h2>
                  <p className="text-white/90 text-sm">Verificación del componente según especificaciones</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex flex-wrap gap-6">
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManguera"
                    value="0"
                    checked={formData.tipoManguera === 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManguera: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Cumple
                  </span>
                </label>
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManguera"
                    value="1"
                    checked={formData.tipoManguera === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManguera: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-red-600 focus:ring-red-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    No cumple
                  </span>
                </label>
                <label className="group flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoManguera"
                    value="2"
                    checked={formData.tipoManguera === 2}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoManguera: parseInt(e.target.value),
                      }))
                    }
                    className="w-5 h-5 text-slate-600 focus:ring-slate-500 focus:ring-offset-2"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    No aplica
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                  Descripción del componente
                </label>
                <input
                  type="text"
                  name="descripcionManguera"
                  value={formData.descripcionManguera}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                             text-slate-900 dark:text-slate-100 placeholder-slate-400
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                             transition-all duration-200"
                  placeholder="Describe el componente observado"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN: Método de Empaque y Cortadora */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Método de Empaque */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="relative p-5 bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold">Método de empaque</h3>
                    <p className="text-white/90 text-xs">Conforme a especificaciones</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="group flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoEmpaque"
                      value="0"
                      checked={formData.metodoEmpaque === 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metodoEmpaque: parseInt(e.target.value),
                        }))
                      }
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Cumple
                    </span>
                  </label>
                  <label className="group flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoEmpaque"
                      value="1"
                      checked={formData.metodoEmpaque === 1}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metodoEmpaque: parseInt(e.target.value),
                        }))
                      }
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      No cumple
                    </span>
                  </label>
                  <label className="group flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="metodoEmpaque"
                      value="2"
                      checked={formData.metodoEmpaque === 2}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metodoEmpaque: parseInt(e.target.value),
                        }))
                      }
                      className="w-4 h-4 text-slate-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-slate-600" />
                      No aplica
                    </span>
                  </label>
                </div>

                {/* Campo Cliente */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                    Cliente
                  </label>
                  <input
                    type="text"
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
            </div>

            {/* Cortadora y Descripción */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="relative p-5 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold">Validación de Máquina y Descripción</h3>
                    <p className="text-white/90 text-xs">Verificación de ajustes y documentación</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Cortadora Ajustada */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    ¿La máquina cortadora se encuentra ajustada correctamente de acuerdo a la TFP-DOC-33 carta de setup?
                  </label>
                  <div className="flex gap-6">
                    <label className="group flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="cortadoraAjustada"
                        checked={formData.cortadoraAjustada === true}
                        onChange={() => setFormData((prev) => ({ ...prev, cortadoraAjustada: true }))}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Sí
                      </span>
                    </label>
                    <label className="group flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="cortadoraAjustada"
                        checked={formData.cortadoraAjustada === false}
                        onChange={() => setFormData((prev) => ({ ...prev, cortadoraAjustada: false }))}
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        <XCircle className="w-4 h-4 text-red-600" />
                        No
                      </span>
                    </label>
                  </div>
                </div>

                {/* Descripción del dibujo */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-600 to-slate-800"></div>
                    Descripción del número de parte del ensamble en dibujo
                  </label>
                  <textarea
                    name="descripcionDibujo"
                    value={formData.descripcionDibujo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500
                               transition-all duration-200 resize-none"
                    placeholder="Describe el número de parte según el dibujo técnico..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Etiquetas */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Etiquetas de Identificación</h2>
                  <p className="text-white/90 text-sm">Escanear o capturar etiquetas del ensamble</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                    Etiqueta Lado A
                  </label>
                  <input
                    type="text"
                    name="etiquetaA"
                    value={formData.etiquetaA}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200"
                    placeholder="Identificación lado A"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-700 to-red-600"></div>
                    Etiqueta Lado B
                  </label>
                  <input
                    type="text"
                    name="etiquetaB"
                    value={formData.etiquetaB}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
                               text-slate-900 dark:text-slate-100 placeholder-slate-400
                               border-slate-200 dark:border-slate-700
                               focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500
                               transition-all duration-200"
                    placeholder="Identificación lado B"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN: Cintas (Opcional) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-700 via-red-600 to-red-500 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Cintas (si aplica)</h2>
                    <p className="text-white/90 text-sm">Registro de cintas aplicadas al ensamble</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all">
                  <input
                    type="checkbox"
                    name="cintas"
                    checked={formData.cintas}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded text-white focus:ring-white"
                  />
                  <span className="text-sm font-medium">Aplicar cintas</span>
                </label>
              </div>
            </div>

            {formData.cintas && (
              <div className="p-8">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">No</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">Longitud</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300">Color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cintas.map((cinta, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-700 to-red-600 text-white text-sm font-bold">
                              {cinta.numeroCinta}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={cinta.longitud}
                              onChange={(e) => handleCintaChange(index, "longitud", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                         text-slate-900 dark:text-slate-100
                                         border-slate-200 dark:border-slate-700
                                         focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                                         transition-all"
                              placeholder="Ej. 50mm"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={cinta.color}
                              onChange={(e) => handleCintaChange(index, "color", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                         text-slate-900 dark:text-slate-100
                                         border-slate-200 dark:border-slate-700
                                         focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                                         transition-all"
                              placeholder="Ej. Rojo"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: SCRAP (Opcional) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-900 via-red-800 to-red-700 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">SCRAP</h2>
                    <p className="text-white/90 text-sm">Registro de material de desecho</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all">
                  <input
                    type="checkbox"
                    name="scrap"
                    checked={formData.scrap}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded text-white focus:ring-white"
                  />
                  <span className="text-sm font-medium">Registrar SCRAP</span>
                </label>
              </div>
            </div>

            {formData.scrap && (
              <div className="p-8 space-y-4">
                {scrapItems.map((item, index) => (
                  <div key={index} className="grid md:grid-cols-3 gap-4 items-end p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad</label>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleScrapChange(index, "cantidad", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                   text-slate-900 dark:text-slate-100
                                   border-slate-200 dark:border-slate-700
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                                   transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Código</label>
                      <input
                        type="text"
                        value={item.codigo}
                        onChange={(e) => handleScrapChange(index, "codigo", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                   text-slate-900 dark:text-slate-100
                                   border-slate-200 dark:border-slate-700
                                   focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500
                                   transition-all"
                        placeholder="Código SCRAP"
                      />
                    </div>
                    <div className="flex gap-2">
                      {index === scrapItems.length - 1 && (
                        <button
                          type="button"
                          onClick={addScrapRow}
                          className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Agregar
                        </button>
                      )}
                      {scrapItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScrapRow(index)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN: Material Sobrante (Opcional) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="relative p-6 bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Cantidad de material sobrante de JOB</h2>
                    <p className="text-white/90 text-sm">Registro de material sobrante para retorno</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all">
                  <input
                    type="checkbox"
                    name="sobrante"
                    checked={formData.sobrante}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded text-white focus:ring-white"
                  />
                  <span className="text-sm font-medium">Registrar sobrante</span>
                </label>
              </div>
            </div>

            {formData.sobrante && (
              <div className="p-8 space-y-4">
                {materialSobrante.map((item, index) => (
                  <div key={index} className="grid md:grid-cols-4 gap-4 items-end p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Item</label>
                      <input
                        type="text"
                        value={item.itemSobrante}
                        onChange={(e) => handleSobranteChange(index, "itemSobrante", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                   text-slate-900 dark:text-slate-100
                                   border-slate-200 dark:border-slate-700
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                                   transition-all"
                        placeholder="ID del item"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cantidad</label>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleSobranteChange(index, "cantidad", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                   text-slate-900 dark:text-slate-100
                                   border-slate-200 dark:border-slate-700
                                   focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                   transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Motivo del retorno</label>
                      <input
                        type="text"
                        value={item.motivoRetorno}
                        onChange={(e) => handleSobranteChange(index, "motivoRetorno", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-slate-950/40
                                   text-slate-900 dark:text-slate-100
                                   border-slate-200 dark:border-slate-700
                                   focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500
                                   transition-all"
                        placeholder="Motivo"
                      />
                    </div>
                    <div className="flex gap-2">
                      {index === materialSobrante.length - 1 && (
                        <button
                          type="button"
                          onClick={addSobranteRow}
                          className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Agregar
                        </button>
                      )}
                      {materialSobrante.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSobranteRow(index)}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 rounded-xl
                         bg-gradient-to-r from-amber-600 to-orange-600 text-white
                         hover:from-amber-500 hover:to-orange-500
                         focus:outline-none focus:ring-4 focus:ring-red-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-105 transition-all duration-200
                         shadow-lg hover:shadow-xl font-semibold"
            >
              <XCircle className="w-5 h-5" />
              Limpiar formulario
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 rounded-xl
                         bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 text-white
                         hover:from-emerald-500 hover:via-green-500 hover:to-teal-500
                         focus:outline-none focus:ring-4 focus:ring-emerald-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-105 transition-all duration-200
                         shadow-lg hover:shadow-xl font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Registrar inspección
                </>
              )}
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}