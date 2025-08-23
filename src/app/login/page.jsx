// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ShieldCheck, 
  Loader2, 
  Sparkles,
  ArrowRight,
  KeyRound,
  Building,
  CheckCircle
} from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-600/20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-600/10 blur-2xl"></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-indigo-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="relative mx-auto w-20 h-20 mb-6">
            {/* Main logo container with animated rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 animate-spin" style={{ animationDuration: '8s' }}>
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-indigo-950"></div>
            </div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <ShieldCheck className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            {/* Glowing effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 blur-lg opacity-50 animate-pulse"></div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-indigo-800 to-violet-800 dark:from-slate-100 dark:via-indigo-200 dark:to-violet-200 bg-clip-text text-transparent">
              Bienvenido de Vuelta
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Accede a tu sistema de gestión
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500">
              <Building className="w-4 h-4" />
              <span>Sistema de Assembly y Producción</span>
            </div>
          </div>
        </div>

        {/* Enhanced Form Card */}
        <div className="relative">
          {/* Background glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
          
          <form
            onSubmit={onSubmit}
            className="relative rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
          >
            {/* Form header */}
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-950 dark:to-violet-950 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                <KeyRound className="w-4 h-4" />
                Autenticación Segura
              </div>
            </div>

            {/* Enhanced Email Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 bg-white dark:bg-slate-950/50 
                             text-slate-900 dark:text-slate-100 
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500
                             placeholder-slate-400 dark:placeholder-slate-500
                             transition-all duration-200 backdrop-blur-sm"
                  placeholder="tu@empresa.com"
                  required
                />
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>

            {/* Enhanced Password Field */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 rounded-xl border-2 bg-white dark:bg-slate-950/50
                             text-slate-900 dark:text-slate-100
                             border-slate-200 dark:border-slate-700
                             focus:outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500
                             placeholder-slate-400 dark:placeholder-slate-500
                             transition-all duration-200 backdrop-blur-sm"
                  placeholder="Tu contraseña segura"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-violet-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <div className="pt-4">
              <button
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white 
                           py-4 px-6 rounded-xl font-semibold text-lg
                           hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500 
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                           shadow-lg hover:shadow-2xl overflow-hidden"
              >
                {/* Button background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {loading ? (
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="animate-spin w-6 h-6 mr-3" />
                    <span>Verificando credenciales...</span>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <User className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </div>

            {/* Security badges */}
            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Conexión segura</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                <span>Datos protegidos</span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Sistema de gestión empresarial</span>
          </div>
        </div>
      </div>
    </div>
  );
}