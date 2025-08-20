// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

const SCHEMA = "dbo";
const TABLE = "Usuarios";

// Helpers
const mask = (str = "") => "*".repeat(Math.min(String(str).length, 24));
const safeBody = ({ correo, password }) => ({
  correo,
  password: password ? `${mask(password)} (len=${password.length})` : undefined,
});
const esc = (name) => `[${String(name).replace(/]/g, "]]")}]`;

const CANDIDATES = {
  id: ["IdUsuario", "IDUsuario", "UsuarioID", "id", "Id", "id_usuario", "UsuarioId"],
  email: ["Correo", "correo", "Email", "email", "Usuario", "user", "username"],
  password: [
    "Contraseña",
    "Contrasena",
    "Contrasenia",
    "Password",
    "Pass",
    "Clave",
    "Pwd",
  ],
};

function findColumn(cols, candidates) {
  const lower = cols.map((c) => c.toLowerCase());
  for (const cand of candidates) {
    const i = lower.indexOf(cand.toLowerCase());
    if (i !== -1) return cols[i];
  }
  return null;
}

async function getTableColumns(pool, schema, table) {
  const q = `
    SELECT c.name AS col
    FROM sys.columns c
    JOIN sys.tables t   ON t.object_id = c.object_id
    JOIN sys.schemas s  ON s.schema_id = t.schema_id
    WHERE s.name = @schema AND t.name = @table
    ORDER BY c.column_id
  `;
  const res = await pool
    .request()
    .input("schema", MSSQL.NVarChar, schema)
    .input("table", MSSQL.NVarChar, table)
    .query(q);
  return res.recordset.map((r) => r.col);
}

export async function POST(req) {
  try {
    const { correo, password } = await req.json();
    console.log("[login] body:", safeBody({ correo, password }));

    if (!correo || !password) {
      console.log("[login] faltan campos:", { hasCorreo: !!correo, hasPassword: !!password });
      return NextResponse.json(
        { error: "Correo y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // 1) Inspeccionar columnas reales
    console.time("[login] inspect columns");
    const cols = await getTableColumns(pool, SCHEMA, TABLE);
    console.timeEnd("[login] inspect columns");
    console.log("[login] columnas en", `${SCHEMA}.${TABLE}:`, cols);

    const emailCol = findColumn(cols, CANDIDATES.email);
    const passCol = findColumn(cols, CANDIDATES.password);
    const idCol = findColumn(cols, CANDIDATES.id);

    console.log("[login] mapeo columnas:", { emailCol, passCol, idCol });

    if (!emailCol || !passCol) {
      console.error("[login] columnas requeridas no encontradas");
      return NextResponse.json(
        { error: "No se encontraron columnas de correo/contraseña en la tabla Usuarios" },
        { status: 500 }
      );
    }

    // 2) Buscar por correo usando el nombre real de columna
    console.time("[login] sql:findUserByEmail");
    const sqlQuery = `
      SELECT TOP 1 *
      FROM ${esc(SCHEMA)}.${esc(TABLE)}
      WHERE ${esc(emailCol)} = @correo
    `;
    const result = await pool
      .request()
      .input("correo", MSSQL.NVarChar, correo)
      .query(sqlQuery);
    console.timeEnd("[login] sql:findUserByEmail");

    console.log("[login] query rows:", {
      recordsetLen: result.recordset?.length ?? 0,
      rowsAffected: result.rowsAffected,
    });

    if (!result.recordset || result.recordset.length === 0) {
      console.log("[login] no se encontró el correo en la base de datos");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    const user = result.recordset[0];
    const stored = user[passCol];
    const hashed = (process.env.PASSWORD_HASHED ?? "false") === "true";
    console.log("[login] usuario encontrado:", {
      id: idCol ? user[idCol] : null,
      correo: user[emailCol],
      hasStoredPassword: !!stored,
      passwordHashMode: hashed ? "bcrypt" : "plaintext",
    });

    // 3) Validar contraseña
    let ok = false;
    if (hashed) {
      console.time("[login] bcrypt.compareSync");
      ok = bcrypt.compareSync(password, stored);
      console.timeEnd("[login] bcrypt.compareSync");
    } else {
      ok = password === stored;
    }
    console.log("[login] password ok?:", ok);

    if (!ok) {
      console.log("[login] contraseña incorrecta");
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    // 4) Éxito
    console.log("[login] login exitoso:", { id: idCol ? user[idCol] : null, correo: user[emailCol] });

    return NextResponse.json({
      ok: true,
      user: {
        id: idCol ? user[idCol] : null,
        correo: user[emailCol],
      },
    });
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
