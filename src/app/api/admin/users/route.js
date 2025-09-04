import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, MSSQL } from "@/lib/mssql";
import { cookies } from "next/headers";

const SCHEMA = "dbo";
const USERS_TABLE = "Usuarios";
const OPERATORS_TABLE = "Operadores";

//* Candidatos de columnas para AMBAS tablas
const C = {
  id:       ["IdUsuario","IDUsuario","UsuarioID","id","Id","id_usuario","UsuarioId","Nomina","EmpleadoID","IdEmpleado","IdOperador","OperadorID"],
  email:    ["Correo","correo","Email","email","Usuario","user","username"],
  password: ["Contraseña","Contrasena","Contrasenia","Password","Pass","Clave","Pwd","password"],
  nombre:   ["Nombre","nombre","Nombres","nombres","NombreCompleto","nombre_completo","FullName","full_name"],
  apellido: ["Apellido","apellidos","Apellidos","apellido","PrimerApellido","SegundoApellido"],
  rol:      ["Rol","rol","Role","Perfil","perfil","TipoUsuario","tipo_usuario","Tipo","tipo","Cargo","cargo","Nivel","nivel"],
  nomina:   ["Nomina","Nómina","nomina","nómina","Legajo","legajo","Empleado","empleado"],
  rfid:     ["RFID","Rfid","Tarjeta","Card","Badge","NFC","Uid","uid","IdTarjeta","CodigoRFID","codigo_rfid"],
};

const esc = (name) => `[${String(name).replace(/]/g, "]]")}]`;

function denyIfNotAdmin() {
  const cok = cookies().get("u_rol")?.value;
  if (cok !== "1") {
    return NextResponse.json({ ok: false, error: "Solo administradores" }, { status: 403 });
  }
  return null;
}

async function getCols(pool, table) {
  const q = `
    SELECT c.name AS col
    FROM sys.columns c
    JOIN sys.tables t ON t.object_id = c.object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name=@schema AND t.name=@table
    ORDER BY c.column_id`;
  const r = await pool.request()
    .input("schema", MSSQL.NVarChar, SCHEMA)
    .input("table", MSSQL.NVarChar, table)
    .query(q);
  return r.recordset.map(x => x.col);
}
function findColumn(cols, list) {
  const lower = cols.map(c => c.toLowerCase());
  for (const cand of list) {
    const i = lower.indexOf(cand.toLowerCase());
    if (i !== -1) return cols[i];
  }
  return null;
}
function pickRow(row, map) {
  return Object.fromEntries(
    Object.entries(map).map(([k, col]) => [k, col ? row[col] : null])
  );
}

function decideTargetTable(rol) {
  const r = Number(rol);
  return (r === 1 || r === 2) ? USERS_TABLE : OPERATORS_TABLE;
}

//* GET: lista combinada
export async function GET() {
  const deny = denyIfNotAdmin(); if (deny) return deny;
  try {
    const pool = await getPool();

    //* Usuarios
    const uCols = await getCols(pool, USERS_TABLE);
    const U = {
      id: findColumn(uCols, C.id),
      email: findColumn(uCols, C.email),
      pass: findColumn(uCols, C.password),
      nombre: findColumn(uCols, C.nombre),
      apellido: findColumn(uCols, C.apellido),
      rol: findColumn(uCols, C.rol),
      nomina: findColumn(uCols, C.nomina),
      rfid: findColumn(uCols, C.rfid),
    };
    const uOrder = U.id || U.email;
    const uQ = `SELECT TOP (1000) * FROM ${esc(SCHEMA)}.${esc(USERS_TABLE)} ORDER BY ${esc(uOrder)}`;
    const uR = await pool.request().query(uQ);
    const usuarios = uR.recordset.map(row => {
      const base = pickRow(row, {
        id: U.id, correo: U.email, nombre: U.nombre, apellido: U.apellido,
        nomina: U.nomina, rol: U.rol, rfid: U.rfid
      });
      return { ...base, source: "usuarios" };
    });

    //* Operadores
    const oCols = await getCols(pool, OPERATORS_TABLE);
    const O = {
      id: findColumn(oCols, C.id),
      email: findColumn(oCols, C.email),
      pass: findColumn(oCols, C.password),
      nombre: findColumn(oCols, C.nombre),
      apellido: findColumn(oCols, C.apellido),
      rol: findColumn(oCols, C.rol), //* puede no existir
      nomina: findColumn(oCols, C.nomina),
      rfid: findColumn(oCols, C.rfid),
    };
    const oOrder = O.id || O.nomina || O.nombre || O.rfid || O.email;
    const oQ = `SELECT TOP (2000) * FROM ${esc(SCHEMA)}.${esc(OPERATORS_TABLE)} ORDER BY ${esc(oOrder)}`;
    const oR = await pool.request().query(oQ);
    const operadores = oR.recordset.map(row => {
      const base = pickRow(row, {
        id: O.id, correo: O.email, nombre: O.nombre, apellido: O.apellido,
        nomina: O.nomina, rfid: O.rfid
      });
      const rol = O.rol ? row[O.rol] : 3;
      return { ...base, rol, source: "operadores" };
    });

    //* merge
    const users = [...usuarios, ...operadores];
    return NextResponse.json({ ok: true, users });
  } catch (e) {
    console.error("[admin/users][GET] error:", e);
    return NextResponse.json({ ok: false, error: "Error al listar" }, { status: 500 });
  }
}

//? POST: crear según rol → tabla
export async function POST(req) {
  const deny = denyIfNotAdmin(); if (deny) return deny;
  try {
    const { correo="", password, nombre="", apellido="", nomina="", rol=3, rfid="" } = await req.json();
    const pool = await getPool();

    const targetTable = decideTargetTable(rol);
    const cols = await getCols(pool, targetTable);

    const Email = findColumn(cols, C.email);
    const Pass  = findColumn(cols, C.password);
    const Nom   = findColumn(cols, C.nombre);
    const Ape   = findColumn(cols, C.apellido);
    const Rol   = findColumn(cols, C.rol);
    const Nomina= findColumn(cols, C.nomina);
    const RFID  = findColumn(cols, C.rfid);

    //* Validaciones mínimas por tabla
    if (targetTable === USERS_TABLE) {
      if (!Email) return NextResponse.json({ ok:false, error:"No hay columna de correo en Usuarios" }, { status:500 });
      if (!Pass)  return NextResponse.json({ ok:false, error:"No hay columna de contraseña en Usuarios" }, { status:500 });
      if (!correo) return NextResponse.json({ ok:false, error:"Correo obligatorio para admin/calidad" }, { status:400 });
      if (!password) return NextResponse.json({ ok:false, error:"Password obligatorio para admin/calidad" }, { status:400 });
    } else {
      //* Operadores: RFID requerido
      if (!RFID) return NextResponse.json({ ok:false, error:"No hay columna RFID en Operadores" }, { status:500 });
      if (!rfid) return NextResponse.json({ ok:false, error:"RFID es obligatorio para operadores" }, { status:400 });
      //* El correo y la contraseña pueden ser opcionales en operadores (según tu modelo)
    }

    const reqq = pool.request();

    //* columnas dinámicas por tabla
    const setCols = [];
    const setVals = [];

    if (Email && correo)  { setCols.push(Email);  setVals.push("@correo");  reqq.input("correo", MSSQL.NVarChar, correo); }
    if (Nom)              { setCols.push(Nom);    setVals.push("@nombre");  reqq.input("nombre", MSSQL.NVarChar, nombre); }
    if (Ape)              { setCols.push(Ape);    setVals.push("@apellido");reqq.input("apellido", MSSQL.NVarChar, apellido); }
    if (Nomina)           { setCols.push(Nomina); setVals.push("@nomina");  reqq.input("nomina", MSSQL.NVarChar, nomina); }
    if (RFID && rfid)     { setCols.push(RFID);   setVals.push("@rfid");    reqq.input("rfid", MSSQL.NVarChar, rfid); }

    if (targetTable === USERS_TABLE) {
      //* Usuarios (admin/calidad): SIEMPRE cifrado
      const hash = await bcrypt.hash(password, 10);
      setCols.push(Pass); setVals.push("@hash"); reqq.input("hash", MSSQL.NVarChar, hash);
      if (Rol) { setCols.push(Rol); setVals.push("@rol"); reqq.input("rol", MSSQL.Int, Number(rol)); }
    } else {
      //* Operadores: contraseña en TEXTO PLANO (solo si viene y existe columna)
      if (Pass && password) {
        setCols.push(Pass); setVals.push("@pass"); reqq.input("pass", MSSQL.NVarChar, password);
      }
      if (Rol) { setCols.push(Rol); setVals.push("@rol"); reqq.input("rol", MSSQL.Int, 3); } //* si existe, forzamos 3
    }

    if (!setCols.length) {
      return NextResponse.json({ ok:false, error:"No hay columnas para insertar" }, { status:400 });
    }

    const q = `
      INSERT INTO ${esc(SCHEMA)}.${esc(targetTable)} (${setCols.map(esc).join(", ")})
      VALUES (${setVals.join(", ")})
    `;
    await reqq.query(q);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users][POST] error:", e);
    return NextResponse.json({ ok: false, error: e?.originalError?.message || e.message || "Error al crear" }, { status: 500 });
  }
}
