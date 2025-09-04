import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs";

const SCHEMA      = "dbo";
const USERS_TABLE = "Usuarios";
const PROV_TABLE  = "Operadores";

//? ---------- Helpers ----------
const mask = (str = "") => "*".repeat(Math.min(String(str).length, 24));
const safeBody = ({ correo, password }) => ({
  correo,
  password: password ? `${mask(password)} (len=${password.length})` : undefined,
});
const esc = (name) => `[${String(name).replace(/]/g, "]]")}]`;
const isBcryptHash = (val) => !!val && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(val);
const normalizeEmail = (x) => String(x || "").trim().toLowerCase();

const CANDIDATES = {
  id:       ["IdUsuario","IDUsuario","UsuarioID","id","Id","id_usuario","UsuarioId","Nomina","ProveedorID","IdProveedor"],
  email:    ["Correo","correo","Email","email","Usuario","user","username"],
  password: ["Contraseña","Contrasena","Contrasenia","Password","Pass","Clave","Pwd","password"],
  nombre:   ["NombreCompleto","nombre_completo","Nombre completo","Nombre","nombre","FullName","full_name","Nombres","nombres"],
  apellido: ["Apellido","apellidos","Apellidos","apellido","PrimerApellido","SegundoApellido"],
  rol:      ["Rol","rol","Role","Perfil","perfil","TipoUsuario","tipo_usuario","Tipo","tipo","Cargo","cargo"],
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

/*
 * Búsqueda por correo en 3 pasos:
 * 1) ESTRICTA:  emailCol = @correo
 * 2) NORMALIZADA: LOWER(LTRIM(RTRIM(emailCol))) = LOWER(LTRIM(RTRIM(@correo)))
 * 3) DIAGNÓSTICO: lista hasta 3 candidatos parecidos (mismo prefijo / dominio)
 */
async function fetchByEmailLoose(pool, schema, table, emailCol, correoRaw) {
  const correoNorm = normalizeEmail(correoRaw);

  //? 1) Estricta
  const qStrict = `
    SELECT TOP 1 *
    FROM ${esc(schema)}.${esc(table)}
    WHERE ${esc(emailCol)} = @correo
  `;
  let r = await pool.request()
    .input("correo", MSSQL.NVarChar, correoRaw)
    .query(qStrict);
  if (r.recordset?.[0]) {
    console.log(`[login][${table}] match STRICT por "${emailCol}"`);
    return r.recordset[0];
  }

  //? 2) Normalizada
  const qNormalized = `
    SELECT TOP 1 *
    FROM ${esc(schema)}.${esc(table)}
    WHERE LOWER(LTRIM(RTRIM(${esc(emailCol)}))) = LOWER(LTRIM(RTRIM(@correoNorm)))
  `;
  r = await pool.request()
    .input("correoNorm", MSSQL.NVarChar, correoNorm)
    .query(qNormalized);
  if (r.recordset?.[0]) {
    console.log(`[login][${table}] match NORMALIZED por "${emailCol}" (LOWER+TRIM)`);
    return r.recordset[0];
  }

  //? 3) Diagnóstico: sugerir hasta 3 correos similares
  try {
    const at = correoNorm.indexOf("@");
    const domain = at > 0 ? correoNorm.slice(at) : "";
    const prefix = at > 0 ? correoNorm.slice(0, Math.max(1, Math.min(5, at))) : correoNorm.slice(0, 5);

    const qDiag = `
      SELECT TOP 3 ${esc(emailCol)} AS candidato
      FROM ${esc(schema)}.${esc(table)}
      WHERE LOWER(${esc(emailCol)}) LIKE LOWER(@like1)
         OR LOWER(${esc(emailCol)}) LIKE LOWER(@like2)
      ORDER BY ${esc(emailCol)}
    `;
    const like1 = prefix + "%";
    const like2 = "%" + domain;
    const d = await pool.request()
      .input("like1", MSSQL.NVarChar, like1)
      .input("like2", MSSQL.NVarChar, like2)
      .query(qDiag);

    console.log(`[login][${table}] sin match. Diagnóstico de candidatos (max 3):`, d.recordset?.map(x => x.candidato));
  } catch (e) {
    console.log(`[login][${table}] diagnóstico falló:`, e?.message);
  }

  return null;
}

function buildDisplayName(row, nombreCol, apellidoCol) {
  if (nombreCol && row[nombreCol]) {
    const nombre = String(row[nombreCol]).trim();
    if (apellidoCol && row[apellidoCol]) {
      const ape = String(row[apellidoCol]).trim();
      if (ape) return `${nombre} ${ape}`.trim();
    }
    return nombre;
  }
  const posibles = ["Nombre", "nombre", "NombreCompleto", "nombre_completo", "FullName", "full_name"];
  for (const p of posibles) {
    if (row[p] && String(row[p]).trim()) return String(row[p]).trim();
  }
  return "Usuario";
}

function extractRole(row, roleCol) {
  if (roleCol && row[roleCol] != null) return String(row[roleCol]).trim();
  const posibles = ["Rol","rol","Role","Perfil","perfil","TipoUsuario","tipo_usuario","Tipo","tipo","Cargo","cargo"];
  for (const p of posibles) {
    if (row[p] != null && String(row[p]).trim()) return String(row[p]).trim();
  }
  return "Usuario";
}

async function updateUserPasswordHash(pool, schema, table, idCol, idVal, passCol, newHash) {
  const q = `
    UPDATE ${esc(schema)}.${esc(table)}
    SET ${esc(passCol)} = @hash
    WHERE ${esc(idCol)} = @id
  `;
  await pool
    .request()
    .input("hash", MSSQL.NVarChar, newHash)
    .input("id", idVal)
    .query(q);
}

export async function POST(req) {
  try {
    const { correo, password } = await req.json();
    console.log("[login] body:", safeBody({ correo, password }));

    if (!correo || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    //* ---- columnas de USUARIOS ----
    const usersCols = await getTableColumns(pool, SCHEMA, USERS_TABLE);
    const uEmailCol = findColumn(usersCols, CANDIDATES.email);
    const uPassCol  = findColumn(usersCols, CANDIDATES.password);
    let   uIdCol    = findColumn(usersCols, CANDIDATES.id);
    let   uNomCol   = findColumn(usersCols, CANDIDATES.nombre);
    let   uApeCol   = findColumn(usersCols, CANDIDATES.apellido);
    let   uRolCol   = findColumn(usersCols, CANDIDATES.rol);

    console.log("[login] columns[USUARIOS]:", {
      table: USERS_TABLE,
      uEmailCol, uPassCol, uIdCol, uNomCol, uApeCol, uRolCol
    });

    if (!uEmailCol || !uPassCol) {
      return NextResponse.json(
        { error: "No se encontraron columnas de correo/contraseña en la tabla Usuarios" },
        { status: 500 }
      );
    }

    //* Para leer el correo del registro encontrado sin tocar uEmailCol
    let emailColForFound = uEmailCol;

    //? ---- Intento #1: USUARIOS ----
    let found = await fetchByEmailLoose(pool, SCHEMA, USERS_TABLE, uEmailCol, correo);
    let source = null;

    if (found) {
      source = "USUARIOS";

      //* Log comparativo input vs DB
      const inputEmail   = String(correo);
      const dbEmailRaw   = String(found[uEmailCol] ?? "");
      const inputNorm    = normalizeEmail(inputEmail);
      const dbEmailNorm  = normalizeEmail(dbEmailRaw);
      console.log("[login][MATCH][USUARIOS] compare:", {
        input: inputEmail,
        db: dbEmailRaw,
        equalStrict: inputEmail === dbEmailRaw,
        equalNorm: inputNorm === dbEmailNorm
      });

      const stored = found[uPassCol];
      if (!stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      if (isBcryptHash(stored)) {
        const ok = await bcrypt.compare(password, stored);
        if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      } else {
        //* Plaintext en DB → comparar directo
        if (password !== stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        //* migrar a bcrypt si tenemos ID
        if (!uIdCol) {
          console.warn("[login] No se pudo migrar a bcrypt: columna ID no encontrada en Usuarios");
        } else {
          const newHash = await bcrypt.hash(password, 10);
          await updateUserPasswordHash(pool, SCHEMA, USERS_TABLE, uIdCol, found[uIdCol], uPassCol, newHash);
          found[uPassCol] = newHash;
        }
      }
    } else {
      //? ---- Intento #2: PROVEEDORES ----
      const provCols = await getTableColumns(pool, SCHEMA, PROV_TABLE);
      const pEmailCol = findColumn(provCols, CANDIDATES.email);
      const pPassCol  = findColumn(provCols, CANDIDATES.password);
      const pIdCol    = findColumn(provCols, CANDIDATES.id);
      const pNomCol   = findColumn(provCols, CANDIDATES.nombre);
      const pApeCol   = findColumn(provCols, CANDIDATES.apellido);
      const pRolCol   = findColumn(provCols, CANDIDATES.rol);

      console.log("[login] columns[PROVEEDORES]:", {
        table: PROV_TABLE,
        pEmailCol, pPassCol, pIdCol, pNomCol, pApeCol, pRolCol
      });

      if (!pEmailCol || !pPassCol) {
        console.log("[login][PROVEEDORES] faltan columnas email/pass → stop");
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }

      const prov = await fetchByEmailLoose(pool, SCHEMA, PROV_TABLE, pEmailCol, correo);
      if (!prov) {
        return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }

      source = "PROVEEDORES";

      //* Log comparativo input vs DB (proveedores)
      const inputEmail   = String(correo);
      const dbEmailRaw   = String(prov[pEmailCol] ?? "");
      const inputNorm    = normalizeEmail(inputEmail);
      const dbEmailNorm  = normalizeEmail(dbEmailRaw);
      console.log("[login][MATCH][PROVEEDORES] compare:", {
        input: inputEmail,
        db: dbEmailRaw,
        equalStrict: inputEmail === dbEmailRaw,
        equalNorm: inputNorm === dbEmailNorm
      });

      const stored = prov[pPassCol];
      if (!stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      if (isBcryptHash(stored)) {
        const ok = await bcrypt.compare(password, stored);
        if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      } else {
        if (password !== stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      }

      //* Homogeneizar referencias (sin tocar uEmailCol)
      found            = prov;
      uIdCol           = pIdCol;
      uNomCol          = pNomCol;
      uApeCol          = pApeCol;
      uRolCol          = pRolCol;
      emailColForFound = pEmailCol || uEmailCol;
    }

    //? ---- éxito: token + cookies ----
    const idVal    = uIdCol ? found[uIdCol] : undefined;
    const emailVal = found[emailColForFound];
    const nombre   = buildDisplayName(found, uNomCol, uApeCol);
    const rol      = extractRole(found, uRolCol);

    const token = await signSession({
      sub: idVal ? String(idVal) : undefined,
      email: String(emailVal),
      rol,
      src: source,
    });

    const res = NextResponse.json({
      ok: true,
      source,
      user: {
        id: idVal ?? null,
        correo: emailVal,
        nombre,
        rol,
      },
    });

    //* Cookie de sesión segura
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    //* Cookies públicas para front
    res.cookies.set("u_nombre", encodeURIComponent(nombre), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    res.cookies.set("u_rol", encodeURIComponent(rol), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
