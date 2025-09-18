import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool, MSSQL } from "@/lib/mssql";
import { cookies } from "next/headers";

const SCHEMA = "dbo";
const USERS_TABLE = "Usuarios";
const OPERATORS_TABLE = "Operadores";

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

const esc = (s) => `[${String(s).replace(/]/g, "]]")}]`;

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

function decideTargetTable(rol) {
  const r = Number(rol);
  return (r === 1 || r === 2) ? USERS_TABLE : OPERATORS_TABLE;
}

async function getOne(pool, table, idValue) {
  const cols = await getCols(pool, table);
  const ID = findColumn(cols, C.id);
  if (!ID) return { row: null, cols };
  const r = await pool.request()
    .input("id", MSSQL.NVarChar, idValue)
    .query(`SELECT TOP 1 * FROM ${esc(SCHEMA)}.${esc(table)} WHERE ${esc(ID)}=@id`);
  return { row: r.recordset?.[0] || null, cols };
}

export async function GET(req, { params }) {
  const deny = denyIfNotAdmin(); if (deny) return deny;
  try {
    const idParam = decodeURIComponent(params.id);
    const source = new URL(req.url).searchParams.get("source"); //* "usuarios" | "operadores" | null
    const pool = await getPool();

    let tryTables = [];
    if (source === "usuarios" || source === "operadores") {
      tryTables = [source === "usuarios" ? USERS_TABLE : OPERATORS_TABLE];
    } else {
      tryTables = [USERS_TABLE, OPERATORS_TABLE];
    }

    for (const table of tryTables) {
      const { row, cols } = await getOne(pool, table, idParam);
      if (row) {
        const Email = findColumn(cols, C.email);
        const Nom   = findColumn(cols, C.nombre);
        const Ape   = findColumn(cols, C.apellido);
        const Rol   = findColumn(cols, C.rol);
        const Nomina= findColumn(cols, C.nomina);
        const RFID  = findColumn(cols, C.rfid);
        const ID    = findColumn(cols, C.id);

        const user = {
          id: row[ID],
          correo: Email ? row[Email] : null,
          nombre: Nom ? row[Nom] : null,
          apellido: Ape ? row[Ape] : null,
          nomina: Nomina ? row[Nomina] : null,
          rol: Rol ? row[Rol] : (table === OPERATORS_TABLE ? 3 : null),
          rfid: RFID ? row[RFID] : null,
          source: table === USERS_TABLE ? "usuarios" : "operadores",
        };
        return NextResponse.json({ ok: true, user });
      }
    }
    return NextResponse.json({ ok:false, error:"No encontrado" }, { status:404 });
  } catch (e) {
    console.error("[admin/users/id][GET] error:", e);
    return NextResponse.json({ ok:false, error:"Error al obtener" }, { status:500 });
  }
}

export async function DELETE(req, { params }) {
  const deny = denyIfNotAdmin(); if (deny) return deny;
  try {
    const idParam = decodeURIComponent(params.id);
    const url = new URL(req.url);
    const source = url.searchParams.get("source"); //* "usuarios" | "operadores" | null
    const pool = await getPool();

    async function deleteFrom(table) {
      const cols = await getCols(pool, table);
      const ID = findColumn(cols, C.id);
      if (!ID) throw new Error(`No se encontró columna ID en tabla ${table}`);
      const r = await pool.request()
        .input("id", MSSQL.NVarChar, idParam)
        .query(`DELETE FROM ${esc(SCHEMA)}.${esc(table)} WHERE ${esc(ID)}=@id`);
      return r.rowsAffected?.[0] || 0;
    }

    if (source === "usuarios" || source === "operadores") {
      const table = source === "usuarios" ? USERS_TABLE : OPERATORS_TABLE;
      const n = await deleteFrom(table);
      if (!n) return NextResponse.json({ ok:false, error:"No encontrado" }, { status:404 });
      return NextResponse.json({ ok:true });
    }

    let n = await deleteFrom(USERS_TABLE);
    if (!n) n = await deleteFrom(OPERATORS_TABLE);
    if (!n) return NextResponse.json({ ok:false, error:"No encontrado" }, { status:404 });
    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error("[admin/users/id][DELETE] error:", e);
    return NextResponse.json({ ok:false, error: e?.originalError?.message || e.message || "Error al eliminar" }, { status:500 });
  }
}

export async function PUT(req, { params }) {
  const deny = denyIfNotAdmin(); if (deny) return deny;
  try {
    const idParam = decodeURIComponent(params.id);
    const url = new URL(req.url);
    const source = url.searchParams.get("source"); //* "usuarios" | "operadores"

    const body = await req.json();
    const { correo, password, nombre="", apellido="", nomina="", rol, rfid } = body;

    const pool = await getPool();

    //? 1) Cargar actual
    let curTable = source === "operadores" ? OPERATORS_TABLE : USERS_TABLE;
    let { row, cols } = await getOne(pool, curTable, idParam);
    if (!row) {
      const other = curTable === USERS_TABLE ? OPERATORS_TABLE : USERS_TABLE;
      const tryOther = await getOne(pool, other, idParam);
      if (tryOther.row) { row = tryOther.row; cols = tryOther.cols; curTable = other; }
    }
    if (!row) return NextResponse.json({ ok:false, error:"No encontrado" }, { status:404 });

    //? 2) Tabla destino según rol (1/2 => Usuarios, otro => Operadores)
    const targetTable = decideTargetTable(rol ?? (curTable===OPERATORS_TABLE?3:1));
    const sameTable = targetTable === curTable;

    //* Helpers columnas actuales
    const ID    = findColumn(cols, C.id);
    const Email = findColumn(cols, C.email);
    const Pass  = findColumn(cols, C.password);
    const Nom   = findColumn(cols, C.nombre);
    const Ape   = findColumn(cols, C.apellido);
    const Rol   = findColumn(cols, C.rol);
    const Nomina= findColumn(cols, C.nomina);
    const RFID  = findColumn(cols, C.rfid);

    //? 3A) Actualización en la misma tabla
    if (sameTable) {
      const sets = [];
      const reqq = pool.request().input("id", MSSQL.NVarChar, idParam);

      if (Email && correo != null) { sets.push(`${esc(Email)}=@correo`); reqq.input("correo", MSSQL.NVarChar, correo); }
      if (Nom   != null)           { sets.push(`${esc(Nom)}=@nombre`);   reqq.input("nombre", MSSQL.NVarChar, nombre); }
      if (Ape   != null)           { sets.push(`${esc(Ape)}=@apellido`); reqq.input("apellido", MSSQL.NVarChar, apellido); }
      if (Nomina!= null)           { sets.push(`${esc(Nomina)}=@nomina`); reqq.input("nomina", MSSQL.NVarChar, nomina); }
      if (RFID  != null && rfid !== undefined) { sets.push(`${esc(RFID)}=@rfid`); reqq.input("rfid", MSSQL.NVarChar, rfid || ""); }
      if (Rol && rol != null)      { sets.push(`${esc(Rol)}=@rol`);      reqq.input("rol", MSSQL.Int, Number(rol)); }

      if (Pass && password !== undefined && password !== null) {
        //! *** Importante: Operadores => NO cifrar ***
        const isOperatorTable = (curTable === OPERATORS_TABLE) || (!rol ? (curTable===OPERATORS_TABLE) : (Number(rol) !== 1 && Number(rol) !== 2));
        const finalPass = isOperatorTable ? password : await bcrypt.hash(password, 10);
        sets.push(`${esc(Pass)}=@pass`);
        reqq.input("pass", MSSQL.NVarChar, finalPass);
      }

      if (!sets.length) return NextResponse.json({ ok:false, error:"Nada para actualizar" }, { status:400 });

      const q = `
        UPDATE ${esc(SCHEMA)}.${esc(curTable)}
        SET ${sets.join(", ")}
        WHERE ${esc(ID)}=@id
      `;
      await reqq.query(q);
      return NextResponse.json({ ok:true });
    }

    //? 3B) Migración entre tablas: INSERT destino + DELETE origen
    const destCols = await getCols(pool, targetTable);
    const dEmail = findColumn(destCols, C.email);
    const dPass  = findColumn(destCols, C.password);
    const dNom   = findColumn(destCols, C.nombre);
    const dApe   = findColumn(destCols, C.apellido);
    const dRol   = findColumn(destCols, C.rol);
    const dNomina= findColumn(destCols, C.nomina);
    const dRFID  = findColumn(destCols, C.rfid);

    const insCols = [];
    const insVals = [];
    const insParams = {};

    //* valores base (body > actual)
    const vCorreo = correo ?? (Email ? row[Email] : "");
    const vNombre = nombre ?? (Nom ? row[Nom] : "");
    const vApe    = apellido ?? (Ape ? row[Ape] : "");
    const vNomina = nomina ?? (Nomina ? row[Nomina] : "");
    const vRFID   = rfid ?? (RFID ? row[RFID] : "");

    if (dEmail && vCorreo)  { insCols.push(dEmail);  insVals.push("@correo"); insParams.correo = vCorreo; }
    if (dNom)               { insCols.push(dNom);    insVals.push("@nombre"); insParams.nombre = vNombre || ""; }
    if (dApe)               { insCols.push(dApe);    insVals.push("@apellido"); insParams.apellido = vApe || ""; }
    if (dNomina)            { insCols.push(dNomina); insVals.push("@nomina"); insParams.nomina = vNomina || ""; }
    if (dRFID)              { insCols.push(dRFID);   insVals.push("@rfid");   insParams.rfid = vRFID || ""; }

    //* password en destino:
    if (dPass && body.password !== undefined && body.password !== null) {
      // *** Operadores => NO cifrar, Usuarios => cifrar ***
      const isDestOperators = (targetTable === OPERATORS_TABLE);
      const finalPass = isDestOperators ? body.password : await bcrypt.hash(body.password, 10);
      insCols.push(dPass); insVals.push("@pass"); insParams.pass = finalPass;
    }
    //* rol en destino:
    const finalRol = (targetTable === USERS_TABLE) ? (rol ?? 1) : 3;
    if (dRol) { insCols.push(dRol); insVals.push("@rol"); insParams.rol = Number(finalRol); }

    if (!insCols.length) {
      return NextResponse.json({ ok:false, error:"No hay columnas para insertar en destino" }, { status:400 });
    }

    const txn = pool.transaction();
    await txn.begin();
    try {
      const insReq = new MSSQL.Request(txn);
      for (const [k,v] of Object.entries(insParams)) {
        const type = k === "rol" ? MSSQL.Int : MSSQL.NVarChar;
        insReq.input(k, type, v);
      }

      await insReq.query(`
        INSERT INTO ${esc(SCHEMA)}.${esc(targetTable)} (${insCols.map(esc).join(", ")})
        VALUES (${insVals.join(", ")})
      `);

      const delCols = await getCols(pool, curTable);
      const curID = findColumn(delCols, C.id);
      await new MSSQL.Request(txn)
        .input("id", MSSQL.NVarChar, idParam)
        .query(`DELETE FROM ${esc(SCHEMA)}.${esc(curTable)} WHERE ${esc(curID)}=@id`);

      await txn.commit();
    } catch (err) {
      await txn.rollback();
      throw err;
    }

    return NextResponse.json({ ok:true });
  } catch (e) {
    console.error("[admin/users/id][PUT] error:", e);
    return NextResponse.json({ ok:false, error: e?.originalError?.message || e.message || "Error al actualizar" }, { status:500 });
  }
}
