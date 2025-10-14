import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";
import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs";

const SCHEMA      = "dbo";
const USERS_TABLE = "Usuarios";
const PROV_TABLE  = "Operadores"; //* <- tabla de operadores

//? ---------- Helpers ----------
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
  nomina:   ["Nomina","NoNomina","NumNomina","NumeroNomina","nomina","no_nomina","num_nomina","numero_nomina"],
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

async function fetchByEmailLoose(pool, schema, table, emailCol, correoRaw) {
  const correoNorm = normalizeEmail(correoRaw);

  //? 1) Estricta
  const qStrict = `
    SELECT TOP 1 *
    FROM ${esc(schema)}.${esc(table)}
    WHERE ${esc(emailCol)} = @correo
  `;
  let r = await pool.request().input("correo", MSSQL.NVarChar, correoRaw).query(qStrict);
  if (r.recordset?.[0]) return r.recordset[0];

  //? 2) Normalizada
  const qNormalized = `
    SELECT TOP 1 *
    FROM ${esc(schema)}.${esc(table)}
    WHERE LOWER(LTRIM(RTRIM(${esc(emailCol)}))) = LOWER(LTRIM(RTRIM(@correoNorm)))
  `;
  r = await pool.request().input("correoNorm", MSSQL.NVarChar, correoNorm).query(qNormalized);
  if (r.recordset?.[0]) return r.recordset[0];

  //? 3) Diagnóstico (opcional logs)
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
    await pool.request()
      .input("like1", MSSQL.NVarChar, prefix + "%")
      .input("like2", MSSQL.NVarChar, "%" + domain)
      .query(qDiag);
  } catch {}

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
  for (const p of posibles) if (row[p] && String(row[p]).trim()) return String(row[p]).trim();
  return "Usuario";
}
function extractRole(row, roleCol) {
  if (roleCol && row[roleCol] != null) return String(row[roleCol]).trim();
  const posibles = ["Rol","rol","Role","Perfil","perfil","TipoUsuario","tipo_usuario","Tipo","tipo","Cargo","cargo"];
  for (const p of posibles) if (row[p] != null && String(row[p]).trim()) return String(row[p]).trim();
  return "Usuario";
}

async function updateUserPasswordHash(pool, schema, table, idCol, idVal, passCol, newHash) {
  const q = `
    UPDATE ${esc(schema)}.${esc(table)}
    SET ${esc(passCol)} = @hash
    WHERE ${esc(idCol)} = @id
  `;
  await pool.request().input("hash", MSSQL.NVarChar, newHash).input("id", idVal).query(q);
}

//? ======== LOGIN =========
export async function POST(req) {
  try {
    const { correo, password } = await req.json();
    if (!correo || !password) {
      return NextResponse.json({ error: "Correo y contraseña son requeridos" }, { status: 400 });
    }

    const pool = await getPool();

    //* Columnas Usuarios
    const usersCols = await getTableColumns(pool, SCHEMA, USERS_TABLE);
    const uEmailCol   = findColumn(usersCols, CANDIDATES.email);
    const uPassCol    = findColumn(usersCols, CANDIDATES.password);
    let   uIdCol      = findColumn(usersCols, CANDIDATES.id);
    let   uNomCol     = findColumn(usersCols, CANDIDATES.nombre);
    let   uApeCol     = findColumn(usersCols, CANDIDATES.apellido);
    let   uRolCol     = findColumn(usersCols, CANDIDATES.rol);
    let   uNominaCol  = findColumn(usersCols, CANDIDATES.nomina);

    if (!uEmailCol || !uPassCol) {
      return NextResponse.json({ error: "No se encontraron columnas de correo/contraseña en Usuarios" }, { status: 500 });
    }

    let source = null;
    let found  = null;
    let currNominaCol = null;
    let emailColForFound = uEmailCol;

    //? 1) Usuarios
    found = await fetchByEmailLoose(pool, SCHEMA, USERS_TABLE, uEmailCol, correo);
    if (found) {
      source = "USUARIOS";
      currNominaCol = uNominaCol;

      const stored = found[uPassCol];
      if (!stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      if (isBcryptHash(stored)) {
        const ok = await bcrypt.compare(password, stored);
        if (!ok) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
      } else {
        if (password !== stored) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
        if (uIdCol) {
          const newHash = await bcrypt.hash(password, 10);
          await updateUserPasswordHash(pool, SCHEMA, USERS_TABLE, uIdCol, found[uIdCol], uPassCol, newHash);
          found[uPassCol] = newHash;
        }
      }
    } else {
      //? 2) Operadores (bloqueados)
      const provCols  = await getTableColumns(pool, SCHEMA, PROV_TABLE);
      const pEmailCol = findColumn(provCols, CANDIDATES.email);
      const pPassCol  = findColumn(provCols, CANDIDATES.password);

      if (pEmailCol && pPassCol) {
        const prov = await fetchByEmailLoose(pool, SCHEMA, PROV_TABLE, pEmailCol, correo);
        if (prov) {
          //! BLOQUEO POR TABLA
          return NextResponse.json(
            { error: "Tu perfil (Operador) no tiene acceso a este sistema." },
            { status: 403 }
          );
        }
      }
      //! si no existe en operadores, seguimos como no encontrado
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
    }

    //! ---- BLOQUEO POR ROL (aunque venga de Usuarios) ----
    const rol = extractRole(found, uRolCol);
    const rolNorm = String(rol ?? "").trim().toLowerCase();
    if (rolNorm === "operador" || rolNorm === "operadores" || rolNorm === "operator" || rolNorm === "3") {
      return NextResponse.json(
        { error: "Tu perfil (Operador) no tiene acceso a este sistema." },
        { status: 403 }
      );
    }

    //* ---- Éxito: token + cookies ----
    const idVal    = uIdCol ? found[uIdCol] : undefined;
    const emailVal = found[emailColForFound];
    const nombre   = buildDisplayName(found, uNomCol, uApeCol);

    //* nómina si existe
    let nominaVal = null;
    if (currNominaCol && found[currNominaCol] != null && String(found[currNominaCol]).trim() !== "") {
      nominaVal = found[currNominaCol];
    } else if (uIdCol && String(uIdCol).toLowerCase() === "nomina") {
      nominaVal = found[uIdCol];
    }

    const token = await signSession({
      sub: idVal ? String(idVal) : undefined,
      email: String(emailVal),
      rol,
      src: source,
      nomina: nominaVal != null ? String(nominaVal) : undefined,
    });

    const res = NextResponse.json({
      ok: true,
      source,
      user: {
        id: idVal ?? null,
        correo: emailVal,
        nombre,
        rol,
        nomina: nominaVal ?? null,
      },
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    res.cookies.set("u_nombre", encodeURIComponent(nombre), {
      httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
    });
    res.cookies.set("u_rol", encodeURIComponent(rol), {
      httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
    });
    if (nominaVal != null && String(nominaVal).trim() !== "") {
      res.cookies.set("u_nomina", encodeURIComponent(String(nominaVal).trim()), {
        httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
      });
    } else {
      res.cookies.set("u_nomina", "", {
        httpOnly: false, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0,
      });
    }

    return res;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 });
  }
}
