// src/lib/mssql.js
// Driver condicional (msnodesqlv8 para Windows Auth)
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const useWindows = (process.env.SQL_AUTH ?? "windows") === "windows";
const sql = useWindows ? require("mssql/msnodesqlv8") : require("mssql");

// === Lectura de .env ===
const HOST = process.env.SQL_SERVER || "localhost";      // p.ej. localhost
const INSTANCE = process.env.SQL_INSTANCE || "";         // p.ej. SQLEXPRESS
const DATABASE = process.env.SQL_DATABASE || "Gates";
const PORT = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined;

const ENCRYPT = (process.env.SQL_ENCRYPT ?? "false").toLowerCase() === "true";
const TRUST = (process.env.SQL_TRUST_CERT ?? "true").toLowerCase() === "true";

// Opciones comunes
const commonOptions = {
  encrypt: ENCRYPT,
  trustServerCertificate: TRUST,
  // enableArithAbort recomendado por Microsoft
  enableArithAbort: true,
};

// Construcción de config según autenticación/driver
const config = useWindows
  ? {
      server: HOST,
      database: DATABASE,
      driver: "msnodesqlv8",
      options: {
        ...commonOptions,
        trustedConnection: true,         // Windows Auth
        // Para INSTANCIA NOMBRADA:
        // Si tienes SQLEXPRESS, usa instanceName. Si además defines un puerto fijo, PORT manda.
        instanceName: INSTANCE || undefined,
        port: PORT,                      // si lo defines, fuerza ese puerto
      },
      // timeouts opcionales
      connectionTimeout: 15000,
      requestTimeout: 15000,
    }
  : {
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: HOST,
      database: DATABASE,
      port: PORT || 1433,               // SQL Login suele usar 1433
      options: {
        ...commonOptions,
        instanceName: INSTANCE || undefined,
      },
      connectionTimeout: 15000,
      requestTimeout: 15000,
    };

// Cachear el pool entre hot-reloads
const g = globalThis;
if (!g.__mssqlPoolPromise) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[db] config resumen ->", {
      driver: useWindows ? "msnodesqlv8 (Windows Auth)" : "tedious (SQL Login)",
      server: HOST,
      instance: INSTANCE || null,
      port: PORT || null,
      database: DATABASE,
      encrypt: ENCRYPT,
      trustServerCertificate: TRUST,
    });
  }
  g.__mssqlPoolPromise = new sql.ConnectionPool(config).connect().then(pool => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[db] conectado OK");
    }
    return pool;
  }).catch(err => {
    console.error("[db] error al conectar:", err);
    throw err;
  });
}

export async function getPool() {
  return g.__mssqlPoolPromise;
}

export const MSSQL = sql;
