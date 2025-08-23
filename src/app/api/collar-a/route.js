import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Adds: [0 Hose, 1 Sleeve, 2 CrimpA, 3 CollarA, 4 CrimpB]
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

//* GET /api/collar-a?assemblyItem=###
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, collarA: null });
    }

    const pool = await getPool();

    const ares = await pool.request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) return NextResponse.json({ ok: true, collarA: null });

    const adds = splitAdds(ares.recordset[0].Adds);
    const collarItem = adds[3] || 0;
    if (!collarItem) return NextResponse.json({ ok: true, collarA: null });

    const cres = await pool.request()
      .input("it", MSSQL.Int, collarItem)
      .query(`
        SELECT TOP 1 [Item],[Description],[Min],[Max],[Nom],[Dies],[Crimp]
        FROM [dbo].[CollarA]
        WHERE [Item] = @it
        ORDER BY [Folio] DESC
      `);

    const collarA = cres.recordset[0] || null;
    return NextResponse.json({ ok: true, collarA });
  } catch (err) {
    console.error("[collar-a][GET] error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener Collar A" }, { status: 500 });
  }
}

//* POST /api/collar-a  (insert/update según Adds[3])
export async function POST(req) {
  try {
    const body = await req.json();

    const assemblyItem = Number(body.assemblyItem);
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }

    const toNum = (v) => (v === "" || v == null ? null : Number(v));
    const toUpper = (v) => (v == null ? "" : String(v).trim().toUpperCase());

    const itemRaw     = body.item; //! requerido solo en inserción
    const description = toUpper(body.description);
    const min         = toNum(body.min);
    const max         = toNum(body.max);
    const nom         = toNum(body.nom);
    const dies        = toUpper(body.dies);
    const crimp       = toUpper(body.crimp);

    const pool = await getPool();

    //* Lee Adds
    const ares = await pool.request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const adds = splitAdds(ares.recordset[0].Adds);
    const currentItem = adds[3] || 0;

    //! Validaciones (todos obligatorios al guardar este formulario)
    const numsOK = [min, max, nom].every((n) => Number.isFinite(n));
    const txtOK  = description.length > 0 && dies.length > 0 && crimp.length > 0;

    if (currentItem > 0) {
      //? UPDATE (Item NO cambia)
      if (!numsOK || !txtOK) {
        return NextResponse.json(
          { ok: false, error: "Description, Min, Max, Nom, Dies y Crimp son obligatorios" },
          { status: 400 }
        );
      }

      await pool.request()
        .input("it", MSSQL.Int, currentItem)
        .input("desc", MSSQL.NVarChar, description)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .input("dies", MSSQL.NVarChar, dies)
        .input("crimp", MSSQL.NVarChar, crimp)
        .query(`
          UPDATE [dbo].[CollarA]
            SET [Description]=@desc, [Min]=@min, [Max]=@max, [Nom]=@nom, [Dies]=@dies, [Crimp]=@crimp
          WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        collarA: { item: currentItem, description, min, max, nom, dies, crimp },
        assembly: { item: assemblyItem, adds: joinAdds(adds) },
      });
    }

    //? INSERT (Item requerido > 0)
    const item = Number(itemRaw);
    if (!Number.isFinite(item) || item <= 0 || !numsOK || !txtOK) {
      return NextResponse.json(
        { ok: false, error: "Item (>0), Description, Min, Max, Nom, Dies y Crimp son obligatorios" },
        { status: 400 }
      );
    }

    //? Calcula Folio
    const f = await pool.request().query(`SELECT ISNULL(MAX([Folio]),0) + 1 AS nextFolio FROM [dbo].[CollarA]`);
    const folio = f.recordset[0]?.nextFolio || 1;

    await pool.request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)
      .input("desc", MSSQL.NVarChar, description)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .input("dies", MSSQL.NVarChar, dies)
      .input("crimp", MSSQL.NVarChar, crimp)
      .query(`
        INSERT INTO [dbo].[CollarA] ([Folio],[Item],[Description],[Min],[Max],[Nom],[Dies],[Crimp])
        VALUES (@folio, @it, @desc, @min, @max, @nom, @dies, @crimp)
      `);

    //? Guarda Item en Adds[3]
    adds[3] = item;
    await pool.request()
      .input("adds", MSSQL.NVarChar, joinAdds(adds))
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@aitem`);

    return NextResponse.json({
      ok: true,
      mode: "insert",
      collarA: { item, description, min, max, nom, dies, crimp, folio },
      assembly: { item: assemblyItem, adds: joinAdds(adds) },
    });
  } catch (err) {
    console.error("[collar-a][POST] error:", err);
    return NextResponse.json({ ok: false, error: "Error al guardar Collar A" }, { status: 500 });
  }
}
