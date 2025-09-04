"use client";

import { useState, useEffect } from "react";
import {
  Save, Loader2, X, UserCog, Info, Crown, Award, Wrench
} from "lucide-react";
import React from "react";

const ROLE_OPTIONS = [
  { 
    value: 1, label: "Administrador", icon: Crown,
    color: "from-purple-500 to-violet-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    textColor: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  { 
    value: 2, label: "Calidad", icon: Award,
    color: "from-emerald-500 to-green-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800"
  },
  { 
    value: 3, label: "Operador", icon: Wrench,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
];

// Validadores
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const NAME_RE = /^[a-záéíóúüñ.'\-\s]{2,}$/i;
const DIGITS_RE = /^\d+$/;

export default function UserFormModal({ 
  show, 
  onClose, 
  onSubmit, 
  initialData = null, 
  saving = false,
  showWarning 
}) {
  const isEdit = initialData?.id != null;

  const [form, setForm] = useState({
    id: initialData?.id || null,
    source: initialData?.source || null,
    correo: initialData?.correo || "",
    password: "",
    nombre: initialData?.nombre || "",
    apellido: initialData?.apellido || "",
    nomina: initialData?.nomina || "",
    rol: Number(initialData?.rol) || 3,
    rfid: initialData?.rfid || "",
  });

  const [errors, setErrors] = useState({
    correo: "", password: "", nombre: "", apellido: "", nomina: "", rfid: "", rol: ""
  });

  // ---- utils de validación por campo
  function validateField(name, value) {
    const v = String(value || "").trim();
    switch (name) {
      case "correo":
        if (!v) return "El correo es obligatorio.";
        if (!EMAIL_RE.test(v)) return "Formato de correo inválido.";
        return "";
      case "password":
        // <-- contraseña opcional en edición
        if (isEdit && v.length === 0) return "";
        if (!v) return "La contraseña es obligatoria.";
        if (v.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
        return "";
      case "nombre":
        if (!v) return "El nombre es obligatorio.";
        if (!NAME_RE.test(v)) return "Solo letras/espacios y mínimo 2 caracteres.";
        return "";
      case "apellido":
        if (!v) return "Los apellidos son obligatorios.";
        if (!NAME_RE.test(v)) return "Solo letras/espacios y mínimo 2 caracteres.";
        return "";
      case "nomina":
        if (!v) return "La nómina es obligatoria.";
        if (!DIGITS_RE.test(v)) return "La nómina debe contener solo dígitos.";
        if (v.length < 4) return "La nómina debe tener al menos 4 dígitos.";
        return "";
      case "rfid":
        if (!v) return "El RFID es obligatorio.";
        if (!DIGITS_RE.test(v)) return "El RFID debe contener solo dígitos.";
        if (v.length < 6) return "El RFID debe tener al menos 6 dígitos.";
        return "";
      case "rol":
        if (![1, 2, 3].includes(Number(v))) return "Selecciona un rol válido.";
        return "";
      default:
        return "";
    }
  }

  function validateAll(current = form) {
    const nextErrors = {
      correo: validateField("correo", current.correo),
      password: validateField("password", current.password),
      nombre: validateField("nombre", current.nombre),
      apellido: validateField("apellido", current.apellido),
      nomina: validateField("nomina", current.nomina),
      rfid: validateField("rfid", current.rfid),
      rol: validateField("rol", current.rol),
    };
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors).find(Boolean);
    return { ok: !firstError, firstError };
  }

  // sincronizar al abrir/editar
  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || null,
        source: initialData.source || null,
        correo: initialData.correo || "",
        password: "", // opcional al editar
        nombre: initialData.nombre || "",
        apellido: initialData.apellido || "",
        nomina: (initialData.nomina || "").toString(),
        rol: Number(initialData.rol) || 3,
        rfid: (initialData.rfid || "").toString(),
      });
      setErrors({ correo: "", password: "", nombre: "", apellido: "", nomina: "", rfid: "", rol: "" });
    }
  }, [initialData]);

  const setFormValue = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { ok, firstError } = validateAll();
    if (!ok) {
      showWarning(firstError || "Corrige los campos marcados.");
      return;
    }

    const payload = {
      correo: form.correo.trim().toLowerCase(),
      // ⚠️ contraseña solo si se proporcionó (en edición puede ir vacía)
      ...(form.password.trim().length > 0 ? { password: form.password.trim() } : {}),
      nombre: form.nombre.trim().toUpperCase(),
      apellido: form.apellido.trim().toUpperCase(),
      nomina: form.nomina.trim(),
      rol: Number(form.rol),
      rfid: form.rfid.trim(),
    };

    onSubmit(payload, form.id, form.source);
  };

  const handleClose = () => {
    if (!saving) {
      setErrors({ correo: "", password: "", nombre: "", apellido: "", nomina: "", rfid: "", rol: "" });
      onClose();
    }
  };

  if (!show) return null;

  const fieldClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border-2 bg-white dark:bg-slate-950/40
     text-slate-900 dark:text-slate-100 placeholder-slate-400
     ${hasError
       ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20"
       : "border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
     } transition-all duration-200`;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[580px] bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-10 relative p-6 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
                </h3>
                <p className="text-white/90 text-sm">
                  {isEdit ? "Actualiza la información del usuario" : "Completa los datos del nuevo usuario"}
                </p>
              </div>
            </div>
            <button
              disabled={saving}
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Rol */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"></div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Rol del Usuario <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
                </label>
              </div>
              <select
                required
                value={form.rol}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormValue({ rol: val });
                  setErrors((er) => ({ ...er, rol: validateField("rol", val) }));
                }}
                className={fieldClass(!!errors.rol)}
                aria-invalid={!!errors.rol}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.rol && <p className="mt-1 text-xs text-rose-600">{errors.rol}</p>}
              <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Los roles 1 y 2 se guardan en <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Usuarios</span>, 
                    y el rol 3 en <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">Operadores</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Correo y RFID */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
                Correo Electrónico
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
              </label>
              <input
                required
                type="email"
                value={form.correo}
                onChange={(e) => {
                  setFormValue({ correo: e.target.value });
                  setErrors((er) => ({ ...er, correo: validateField("correo", e.target.value) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, correo: validateField("correo", e.target.value) }))}
                placeholder="usuario@empresa.com"
                className={fieldClass(!!errors.correo)}
                aria-invalid={!!errors.correo}
              />
              {errors.correo && <p className="text-xs text-rose-600">{errors.correo}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                RFID
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
              </label>
              <input
                required
                value={form.rfid}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setFormValue({ rfid: onlyDigits });
                  setErrors((er) => ({ ...er, rfid: validateField("rfid", onlyDigits) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, rfid: validateField("rfid", e.target.value) }))}
                placeholder="123456"
                type="text"
                inputMode="numeric"
                pattern="\d+"
                minLength={6}
                className={fieldClass(!!errors.rfid) + " font-mono"}
                aria-invalid={!!errors.rfid}
              />
              {errors.rfid && <p className="text-xs text-rose-600">{errors.rfid}</p>}
            </div>
          </div>

          {/* Nombre y Apellidos */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                Nombre
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setFormValue({ nombre: v });
                  setErrors((er) => ({ ...er, nombre: validateField("nombre", v) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, nombre: validateField("nombre", e.target.value) }))}
                placeholder="NOMBRE DEL USUARIO"
                className={fieldClass(!!errors.nombre) + " uppercase"}
                aria-invalid={!!errors.nombre}
              />
              {errors.nombre && <p className="text-xs text-rose-600">{errors.nombre}</p>}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                Apellidos
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
              </label>
              <input
                required
                value={form.apellido}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setFormValue({ apellido: v });
                  setErrors((er) => ({ ...er, apellido: validateField("apellido", v) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, apellido: validateField("apellido", e.target.value) }))}
                placeholder="APELLIDOS DEL USUARIO"
                className={fieldClass(!!errors.apellido) + " uppercase"}
                aria-invalid={!!errors.apellido}
              />
              {errors.apellido && <p className="text-xs text-rose-600">{errors.apellido}</p>}
            </div>
          </div>

          {/* Nómina y Contraseña */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                Nómina
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">Obligatorio</span>
              </label>
              <input
                required
                value={form.nomina}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setFormValue({ nomina: onlyDigits });
                  setErrors((er) => ({ ...er, nomina: validateField("nomina", onlyDigits) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, nomina: validateField("nomina", e.target.value) }))}
                placeholder="1234"
                type="text"
                inputMode="numeric"
                pattern="\d+"
                minLength={4}
                className={fieldClass(!!errors.nomina) + " font-mono"}
                aria-invalid={!!errors.nomina}
              />
              {errors.nomina && <p className="text-xs text-rose-600">{errors.nomina}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></div>
                {isEdit ? "Nueva Contraseña (opcional)" : "Contraseña"}
                {!isEdit && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    Obligatorio
                  </span>
                )}
              </label>
              <input
                // requerido solo al crear
                required={!isEdit}
                type="password"
                value={form.password}
                onChange={(e) => {
                  setFormValue({ password: e.target.value });
                  setErrors((er) => ({ ...er, password: validateField("password", e.target.value) }));
                }}
                onBlur={(e) => setErrors((er) => ({ ...er, password: validateField("password", e.target.value) }))}
                placeholder={isEdit ? "Deja vacío para mantener la actual (mín. 8 si cambias)" : "Contraseña segura (mín. 8)"}
                minLength={isEdit && form.password.trim().length === 0 ? undefined : 8}
                className={fieldClass(!!errors.password)}
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              disabled={saving}
              onClick={handleClose}
              className="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 
                         bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
                         hover:bg-slate-50 dark:hover:bg-slate-700
                         focus:outline-none focus:ring-4 focus:ring-slate-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 font-semibold"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              type="submit"
              className="group relative inline-flex items-center gap-3 px-8 py-3 rounded-xl
                         bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white
                         hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500
                         focus:outline-none focus:ring-4 focus:ring-indigo-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transform hover:scale-105 transition-all duration-200
                         shadow-lg hover:shadow-xl font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEdit ? "Actualizar Usuario" : "Crear Usuario"}
                </>
              )}
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
