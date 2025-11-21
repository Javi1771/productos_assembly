import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sql = require("mssql"); //* <- SIEMPRE 'mssql' (driver tedious)

//? ── Variables de entorno ──────────────────────────────────────────────
const HOST     = process.env.SQL_SERVER || "localhost";
const INSTANCE = process.env.SQL_INSTANCE || "";    
const DATABASE = process.env.SQL_DATABASE || "Gates";
const PORT     = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : undefined;

const ENCRYPT  = (process.env.SQL_ENCRYPT ?? "false").toLowerCase() === "true";
const TRUST    = (process.env.SQL_TRUST_CERT ?? "true").toLowerCase() === "true";

const USER     = process.env.SQL_USER;
const PASSWORD = process.env.SQL_PASSWORD;

//* Puerto efectivo: si hay instancia, no usar puerto (usa SQL Browser);
//! si NO hay instancia, usa PORT || 1433
const effectivePort = INSTANCE ? undefined : (PORT ?? 1433);

// ── Config del pool ───────────────────────────────────────────────────
const config = {
  user: USER,
  password: PASSWORD,
  server: HOST,
  database: DATABASE,
  port: effectivePort,
  options: {
    instanceName: INSTANCE || undefined,
    encrypt: ENCRYPT,
    trustServerCertificate: TRUST,
    enableArithAbort: true,
    appName: "Assembly-App",
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

//? ── Pool cacheado ─────────────────────────────────────────────────────
const g = globalThis;
if (!g.__mssqlPoolPromise) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[db] config resumen ->", {
      driver: "tedious (SQL Login)",
      server: HOST,
      instance: INSTANCE || null,
      port: effectivePort || null,
      database: DATABASE,
      encrypt: ENCRYPT,
      trustServerCertificate: TRUST,
    });
  }
  g.__mssqlPoolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      if (process.env.NODE_ENV !== "production") console.log("[db] Conectado OK");
      return pool;
    })
    .catch(err => {
      console.error("[db] Error al conectar:", err);
      throw err;
    });
}

export async function getPool() {
  return g.__mssqlPoolPromise;
}

export async function query(q, inputs = {}) {
  const pool = await getPool();
  const req = pool.request();
  for (const [k, v] of Object.entries(inputs)) req.input(k, v);
  const result = await req.query(q);
  return result;
}

export async function closePool() {
  const pool = await getPool();
  await pool.close();
  g.__mssqlPoolPromise = null;
}

export const MSSQL = sql;
