"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

/*
 * Topbar global reutilizable y configurable (responsive-friendly).
 *
 * Props:
 * - title: string (requerido)
 * - subtitle?: string
 * - icon?: React.ComponentType<any>  // ej. Shield de lucide-react
 * - gradient?: string                 // tailwind classes: "from-... via-... to-..."
 * - containerMax?: string             // ej. "max-w-7xl"
 * - backText?: string                 // texto del botón Volver (default: "Volver")
 * - onBack?: () => void               // si no se pasa, hace router.back()
 * - rightExtra?: React.ReactNode      // chips/badges personalizados del lado derecho
 * - newButton?: { label: string, onClick: () => void, icon?: React.ComponentType<any> }
 * - sticky?: boolean                  // haz el topbar sticky (default: false)
 * - showBack?: boolean                // oculta el botón Volver (default: true)
 */
export default function GlobalTopbar({
  title,
  subtitle,
  icon: Icon,
  gradient = "from-indigo-600 via-violet-600 to-purple-600",
  containerMax = "max-w-7xl",
  backText = "Volver",
  onBack,
  rightExtra,
  newButton,
  sticky = false,
  showBack = true,
}) {
  const router = useRouter();
  const handleBack = () => (onBack ? onBack() : router.back());
  const NewBtnIcon = newButton?.icon ?? Sparkles;

  return (
    <header
      className={[
        "relative border-b border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-r",
        gradient,
        "text-white shadow-lg",
        sticky ? "sticky top-0 z-50" : "",
      ].join(" ")}
    >
      {/* Overlay decorativo */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Efectos de brillo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <div className={`relative ${containerMax} mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4`}>
        {/* Layout: en móvil apila (flex-col), en desktop una sola fila (flex-row) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
          
          {/* IZQUIERDA: Volver + Icono + Títulos */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={handleBack}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-lg shrink-0"
                aria-label={backText}
                title={backText}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="hidden sm:inline">{backText}</span>
                </span>
              </button>
            )}

            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {Icon && (
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/15 backdrop-blur-sm shrink-0 shadow-lg">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="hidden sm:block text-white/90 text-xs sm:text-sm font-medium mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* DERECHA: Extras + botón opcional
              En desktop (lg+) se mantienen en línea sin hacer wrap
              En móvil/tablet hace wrap si es necesario */}
          <div className="flex items-center justify-start lg:justify-end gap-2 sm:gap-3 flex-wrap lg:flex-nowrap shrink-0">
            {/* Contenedor para rightExtra */}
            {rightExtra && (
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap">
                {rightExtra}
              </div>
            )}

            {/* Botón extra (ej. "Nuevo registro") */}
            {newButton && (
              <button
                onClick={newButton.onClick}
                className="group px-3 sm:px-4 py-2 rounded-lg bg-white hover:bg-white/95 text-indigo-600 border border-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg font-semibold shrink-0"
                title={newButton.label}
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <NewBtnIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline">{newButton.label}</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}