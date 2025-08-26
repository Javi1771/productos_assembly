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
      <div className="absolute inset-0 bg-black/10" />
      {/* Paddings reducidos en móvil, amplios en desktop */}
      <div className={`relative ${containerMax} mx-auto px-3 sm:px-4 py-3 sm:py-4`}>
        {/* En móvil apila (2 filas): izquierda arriba, derecha abajo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center">
          {/* IZQUIERDA: Volver + Icono + Títulos */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 sm:gap-4">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  aria-label={backText}
                  title={backText}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {/* Oculta el texto en móvil para ahorrar espacio */}
                    <span className="hidden sm:inline">{backText}</span>
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {Icon && (
                  <div className="p-2 rounded-lg bg-white/15 backdrop-blur-sm shrink-0">
                    {/* Icono más chico en móvil */}
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  {/* Título se reduce y trunca en móvil */}
                  <h1 className="text-lg sm:text-xl font-bold truncate">
                    {title}
                  </h1>
                  {subtitle && (
                    // En móvil oculto para compactar; visible en sm+
                    <p className="hidden sm:block text-white/80 text-xs">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DERECHA: Extras (chips) + botón opcional
              En móvil se coloca bajo el bloque izquierdo (2ª fila) y permite wrap */}
          <div className="min-w-0">
            <div className="flex items-center justify-start sm:justify-end gap-2 sm:gap-3 flex-wrap">
              {/* Contenedor para rightExtra (si trae chips anchos, hará wrap) */}
              {rightExtra && (
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {rightExtra}
                </div>
              )}

              {/* Botón extra (ej. "Nuevo registro") */}
              {newButton && (
                <button
                  onClick={newButton.onClick}
                  className="group px-3 sm:px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  title={newButton.label}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <NewBtnIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    {/* Oculta el texto en pantallas muy chicas si te estorba el ancho */}
                    <span className="hidden sm:inline">{newButton.label}</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
