// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck } from "lucide-react";
import { useAlert } from "@/components/AlertSystem";

export default function LoginPage() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error de login");

      showSuccess("¡Bienvenido! Sesión iniciada correctamente");
      setTimeout(() => router.replace("/assembly/new"), 1000);
    } catch (e) {
      showError(e.message, "Error de Autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br
                 from-[var(--grad-from)] to-[var(--grad-to)]
                 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md">
        {/* Header con logo/icono */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--fg)] mb-2">
            Bienvenido
          </h1>
          <p className="text-[var(--muted)]">
            Inicia sesión para continuar
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl shadow-xl border p-8 space-y-6
                     bg-[var(--card)] text-[var(--card-foreground)] border-[var(--border)]"
        >
          {/* Campo de correo */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-[var(--muted)]" />
              </div>
              <input
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg outline-none
                           border bg-[var(--card)] text-[var(--card-foreground)] border-[var(--border)]
                           focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          {/* Campo de contraseña */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[var(--muted)]" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg outline-none
                           border bg-[var(--card)] text-[var(--card-foreground)] border-[var(--border)]
                           focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted)] hover:opacity-80"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón de envío */}
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white 
                       py-3 px-4 rounded-lg font-medium
                       hover:from-blue-600 hover:to-indigo-700 
                       focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                       shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <User className="w-5 h-5 mr-2" />
                Iniciar sesión
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
