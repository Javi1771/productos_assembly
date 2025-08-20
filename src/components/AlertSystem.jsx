// src/components/AlertSystem.jsx
"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

// Context para las alertas
const AlertContext = createContext();

// Hook para usar las alertas
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert debe ser usado dentro de AlertProvider");
  }
  return context;
};

// Componente individual de alerta
const Alert = ({ alert, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-remove después de la duración especificada
    if (alert.duration && alert.duration > 0) {
      const timer = setTimeout(() => handleRemove(), alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert.duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(alert.id), 300); // Tiempo de animación de salida
  };

  const getIcon = () => {
    switch (alert.type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <XCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4";
    switch (alert.type) {
      case "success":
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-200`;
      case "error":
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-200`;
      case "warning":
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200`;
    }
  };

  const getIconColor = () => {
    switch (alert.type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isExiting 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95"
        }
      `}
    >
      <div
        className={`
          max-w-sm w-full rounded-lg shadow-lg backdrop-blur-sm
          ${getStyles()}
          p-4 flex items-start space-x-3
        `}
      >
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {alert.title && (
            <h4 className="text-sm font-medium mb-1">
              {alert.title}
            </h4>
          )}
          <p className="text-sm opacity-90">
            {alert.message}
          </p>
        </div>

        <button
          onClick={handleRemove}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Contenedor de alertas
const AlertContainer = ({ alerts, removeAlert }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          alert={alert}
          onRemove={removeAlert}
        />
      ))}
    </div>
  );
};

// Provider de alertas
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = ({
    type = "success",
    title,
    message,
    duration = 5000, // 5 segundos por defecto
  }) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      type,
      title,
      message,
      duration,
    };

    setAlerts((prev) => [...prev, newAlert]);
    
    return id; // Retorna el ID para poder remover manualmente si es necesario
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  // Funciones de conveniencia
  const showSuccess = (message, title = null, duration = 5000) => {
    return addAlert({ type: "success", title, message, duration });
  };

  const showError = (message, title = null, duration = 7000) => {
    return addAlert({ type: "error", title, message, duration });
  };

  const showWarning = (message, title = null, duration = 6000) => {
    return addAlert({ type: "warning", title, message, duration });
  };

  const value = {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    showSuccess,
    showError,
    showWarning,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
    </AlertContext.Provider>
  );
};

// Ejemplo de uso en un componente
export const AlertExamples = () => {
  const { showSuccess, showError, showWarning } = useAlert();

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold mb-4">Ejemplos de Alertas</h2>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => showSuccess("Producto guardado correctamente")}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Alerta de Éxito
        </button>

        <button
          onClick={() => showError("Error al conectar con el servidor", "Error de Conexión")}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Alerta de Error
        </button>

        <button
          onClick={() => showWarning("El stock está por agotarse", "Advertencia")}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Alerta de Advertencia
        </button>

        <button
          onClick={() => showSuccess("Esta alerta no se auto-elimina", "Persistente", 0)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Alerta Persistente
        </button>
      </div>
    </div>
  );
};