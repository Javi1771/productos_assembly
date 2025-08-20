"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleGlobal() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null; //* evita mismatch de hidratación

  const next = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Cambiar a modo ${next === "dark" ? "oscuro" : "claro"}`}
      title={`Cambiar a modo ${next === "dark" ? "oscuro" : "claro"}`}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center justify-center
                 rounded-full border border-slate-200 bg-white/90 p-3 shadow-md backdrop-blur
                 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-900"
    >
      {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
