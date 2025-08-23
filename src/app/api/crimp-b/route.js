import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Adds: [0 Hose, 1 Sleeve, 2 CrimpA, 3 CollarA, 4 CrimpB, 5 CollarB?, 6 Packaging?]
function splitAdds(addsStr) {
  const parts = String(addsStr || "")
    .split("|")
    .map((p) => (p && /^\d+$/.test(p) ? Number(p) : 0));
  while (parts.length < 5) parts.push(0); //* asegurar índice 4 (CrimpB)
  return parts;
}
function joinAdds(parts) {
  return parts.map((n) => (Number(n) > 0 ? String(n) : "0")).join("|");
}

//* GET /api/crimp-b?assemblyItem=###
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, crimpB: null });
    }

    const pool = await getPool();

    const ares = await pool.request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) return NextResponse.json({ ok: true, crimpB: null });

    const adds = splitAdds(ares.recordset[0].Adds);
    const crimpBItem = adds[4] || 0;
    if (!crimpBItem) return NextResponse.json({ ok: true, crimpB: null });

    const cres = await pool.request()
      .input("it", MSSQL.Int, crimpBItem)
      .query(`
        SELECT TOP 1
          [Item],[Description],[Min],[Nom],[Max],[Curv],[Dies],[Crimp],
          [MinO],[NomO],[MaxO]
        FROM [dbo].[CrimpB]
        WHERE [Item] = @it
        ORDER BY [Folio] DESC
      `);

    const crimpB = cres.recordset[0] || null;
    return NextResponse.json({ ok: true, crimpB });
  } catch (err) {
    console.error("[crimp-b][GET] error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener Crimp B" }, { status: 500 });
  }
}

//* POST /api/crimp-b (insert/update según Adds[4])
export async function POST(req) {
  try {
    const body = await req.json();

    const assemblyItem = Number(body.assemblyItem);
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }

    //* opcionales -> número o null
    const toNum = (v) => (v === "" || v == null ? null : Number(v));

    const itemRaw     = body.item; //! requerido SOLO en inserción
    const description = (body.description ?? "").toString().trim(); //! requerido
    const min         = toNum(body.min);
    const nom         = toNum(body.nom);
    const max         = toNum(body.max);
    const curv        = (body.curv ?? "").toString().trim() || null; //* opcional (suele ser 1 letra)
    const dies        = (body.dies ?? "").toString().trim() || null; //* opcional
    const crimp       = (body.crimp ?? "").toString().trim() || null; //* opcional
    const minO        = toNum(body.minO);
    const nomO        = toNum(body.nomO);
    const maxO        = toNum(body.maxO);

    if (!description) {
      return NextResponse.json({ ok: false, error: "Description es obligatoria" }, { status: 400 });
    }

    const pool = await getPool();

    //* Lee Adds
    const ares = await pool.request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const adds = splitAdds(ares.recordset[0].Adds);
    const currentItem = adds[4] || 0;

    if (currentItem > 0) {
      //? UPDATE (Item NO cambia)
      await pool.request()
        .input("it", MSSQL.Int, currentItem)
        .input("desc", MSSQL.NVarChar, description)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("curv", MSSQL.NVarChar, curv)
        .input("dies", MSSQL.NVarChar, dies)
        .input("crimp", MSSQL.NVarChar, crimp)
        .input("minO", MSSQL.Decimal(18, 6), minO)
        .input("nomO", MSSQL.Decimal(18, 6), nomO)
        .input("maxO", MSSQL.Decimal(18, 6), maxO)
        .query(`
          UPDATE [dbo].[CrimpB]
            SET [Description]=@desc, [Min]=@min, [Nom]=@nom, [Max]=@max,
                [Curv]=@curv, [Dies]=@dies, [Crimp]=@crimp,
                [MinO]=@minO, [NomO]=@nomO, [MaxO]=@maxO
          WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        crimpB: { item: currentItem, description, min, nom, max, curv, dies, crimp, minO, nomO, maxO },
        assembly: { item: assemblyItem, adds: joinAdds(adds) },
      });
    }

    //? INSERT (Item requerido > 0)
    const item = Number(itemRaw);
    if (!Number.isFinite(item) || item <= 0) {
      return NextResponse.json({ ok: false, error: "Item (>0) es obligatorio al crear" }, { status: 400 });
    }

    //? Calcula Folio
    const f = await pool.request().query(`SELECT ISNULL(MAX([Folio]),0) + 1 AS nextFolio FROM [dbo].[CrimpB]`);
    const folio = f.recordset[0]?.nextFolio || 1;

    await pool.request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)
      .input("desc", MSSQL.NVarChar, description)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("curv", MSSQL.NVarChar, curv)
      .input("dies", MSSQL.NVarChar, dies)
      .input("crimp", MSSQL.NVarChar, crimp)
      .input("minO", MSSQL.Decimal(18, 6), minO)
      .input("nomO", MSSQL.Decimal(18, 6), nomO)
      .input("maxO", MSSQL.Decimal(18, 6), maxO)
      .query(`
        INSERT INTO [dbo].[CrimpB]
        ([Folio],[Item],[Description],[Min],[Nom],[Max],[Curv],[Dies],[Crimp],[MinO],[NomO],[MaxO])
        VALUES (@folio, @it, @desc, @min, @nom, @max, @curv, @dies, @crimp, @minO, @nomO, @maxO)
      `);

    //? Guarda Item en Adds[4]
    adds[4] = item;
    await pool.request()
      .input("adds", MSSQL.NVarChar, joinAdds(adds))
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@aitem`);

    return NextResponse.json({
      ok: true,
      mode: "insert",
      crimpB: { item, description, min, nom, max, curv, dies, crimp, minO, nomO, maxO, folio },
      assembly: { item: assemblyItem, adds: joinAdds(adds) },
    });
  } catch (err) {
    console.error("[crimp-b][POST] error:", err);
    return NextResponse.json({ ok: false, error: "Error al guardar Crimp B" }, { status: 500 });
  }
}
