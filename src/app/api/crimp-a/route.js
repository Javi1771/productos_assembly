import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Helpers Adds
function splitAdds(addsStr) {
  const parts = String(addsStr || "")
    .split("|")
    .map((p) => (p && /^\d+$/.test(p) ? Number(p) : 0));
  while (parts.length < 5) parts.push(0);
  return parts;
}
function joinAdds(parts) {
  return parts.map((n) => (Number(n) > 0 ? String(n) : "0")).join("|");
}

//* GET /api/crimp-a?assemblyItem=### */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, crimpA: null });
    }

    const pool = await getPool();

    const ares = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) return NextResponse.json({ ok: true, crimpA: null });

    const adds = splitAdds(ares.recordset[0].Adds);
    const crimpItem = adds[2] || 0;

    if (!crimpItem) return NextResponse.json({ ok: true, crimpA: null });

    const cres = await pool
      .request()
      .input("it", MSSQL.Int, crimpItem)
      .query(`
        SELECT TOP 1 [Item],[Fitting],[Min],[Max],[Nom],[Curv],[Dies],[Crimp]
        FROM [dbo].[CrimpA]
        WHERE [Item] = @it
        ORDER BY [Folio] DESC
      `);

    const crimpA = cres.recordset[0] || null;
    return NextResponse.json({ ok: true, crimpA });
  } catch (err) {
    console.error("[crimp-a][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener Crimp A" },
      { status: 500 }
    );
  }
}

//** POST /api/crimp-a  (insert/update con todos los campos obligatorios) */
export async function POST(req) {
  try {
    const body = await req.json();

    const assemblyItem = Number(body.assemblyItem);
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }

    const asNumberOrNull = (v) => (v === "" || v == null ? null : Number(v));
    const nonEmpty = (v) => (v == null ? "" : String(v).trim());

    const itemRaw  = body.item;
    const fitting  = nonEmpty(body.fitting);
    const min      = asNumberOrNull(body.min);
    const max      = asNumberOrNull(body.max);
    const nom      = asNumberOrNull(body.nom);
    const dies     = nonEmpty(body.dies);
    const crimpIn  = nonEmpty(body.crimp) || "NORMAL";
    const curvIn   = nonEmpty(body.curv);

    //* normalizar Curv a UNA letra mayúscula
    const curv = curvIn ? curvIn[0].toUpperCase() : "";

    const pool = await getPool();

    //* leer Adds
    const ares = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const addsParts = splitAdds(ares.recordset[0].Adds);
    const currentCrimpItem = addsParts[2] || 0;

    //* Validación común (todos obligatorios; item solo obligatorio en inserción)
    const checkNumbers = [min, max, nom].every((n) => Number.isFinite(n));
    const checkTexts   = [fitting, dies, crimpIn, curv].every((t) => t && t.length > 0);

    if (currentCrimpItem > 0) {
      //* UPDATE: item no cambia, pero los demás SON obligatorios
      if (!checkNumbers || !checkTexts) {
        return NextResponse.json(
          { ok: false, error: "Todos los campos son obligatorios (Fitting, Min, Max, Nom, Curv, Dies, Crimp)" },
          { status: 400 }
        );
      }

      await pool
        .request()
        .input("it", MSSQL.Int, currentCrimpItem)
        .input("fit", MSSQL.NVarChar, fitting)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .input("curv", MSSQL.NVarChar, curv)
        .input("dies", MSSQL.NVarChar, dies)
        .input("crimp", MSSQL.NVarChar, crimpIn)
        .query(`
          UPDATE [dbo].[CrimpA]
          SET [Fitting]=@fit, [Min]=@min, [Max]=@max, [Nom]=@nom,
              [Curv]=@curv, [Dies]=@dies, [Crimp]=@crimp
          WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        crimpA: { item: currentCrimpItem, fitting, min, max, nom, curv, dies, crimp: crimpIn },
        assembly: { item: assemblyItem, adds: joinAdds(addsParts) },
      });
    }

    //! INSERT: TODOS obligatorios, incluido item (>0)
    const item = Number(itemRaw);
    if (!Number.isFinite(item) || item <= 0 || !checkNumbers || !checkTexts) {
      return NextResponse.json(
        { ok: false, error: "Todos los campos son obligatorios (incluido Item > 0)" },
        { status: 400 }
      );
    }

    //* calcular Folio
    const fres = await pool.request().query(`
      SELECT ISNULL(MAX([Folio]),0) + 1 AS nextFolio FROM [dbo].[CrimpA]
    `);
    const folio = fres.recordset[0]?.nextFolio || 1;

    await pool
      .request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)
      .input("fit", MSSQL.NVarChar, fitting)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .input("curv", MSSQL.NVarChar, curv)
      .input("dies", MSSQL.NVarChar, dies)
      .input("crimp", MSSQL.NVarChar, crimpIn)
      .query(`
        INSERT INTO [dbo].[CrimpA] ([Folio],[Item],[Fitting],[Min],[Max],[Nom],[Curv],[Dies],[Crimp])
        VALUES (@folio, @it, @fit, @min, @max, @nom, @curv, @dies, @crimp)
      `);

    //* guardar Item en Adds[2]
    addsParts[2] = item;
    await pool
      .request()
      .input("adds", MSSQL.NVarChar, joinAdds(addsParts))
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@aitem`);

    return NextResponse.json({
      ok: true,
      mode: "insert",
      crimpA: { item, fitting, min, max, nom, curv, dies, crimp: crimpIn, folio },
      assembly: { item: assemblyItem, adds: joinAdds(addsParts) },
    });
  } catch (err) {
    console.error("[crimp-a][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al guardar Crimp A" },
      { status: 500 }
    );
  }
}
