import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Indices en Adds:
//* 0: Hose, 1: Sleeve/Guard, 2: CrimpA, 3: CollarA, 4: CrimpB, 5: CollarB, 6: Packaging
const PACKAGING_INDEX = 6;

function splitAdds(addsStr) {
  const parts = String(addsStr || "")
    .split("|")
    .map((p) => (p && /^\d+$/.test(p) ? Number(p) : 0));
  while (parts.length <= PACKAGING_INDEX) parts.push(0);
  return parts;
}
function joinAdds(parts) {
  return parts.map((n) => (Number(n) > 0 ? String(n) : "0")).join("|");
}

//* GET /api/packaging?assemblyItem=###
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, packaging: null });
    }

    const pool = await getPool();
    const a = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!a.recordset.length) return NextResponse.json({ ok: true, packaging: null });

    const adds = splitAdds(a.recordset[0].Adds);
    const pkgItem = adds[PACKAGING_INDEX] || 0;
    if (!pkgItem) return NextResponse.json({ ok: true, packaging: null });

    const r = await pool
      .request()
      .input("it", MSSQL.Int, pkgItem)
      .query(`
        SELECT TOP 1 [Item],[Min],[Nom],[Max],[CapA],[CapB]
        FROM [dbo].[Packaging]
        WHERE [Item] = @it
        ORDER BY [Folio] DESC
      `);

    return NextResponse.json({ ok: true, packaging: r.recordset[0] || null });
  } catch (err) {
    console.error("[packaging][GET] error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener Packaging" }, { status: 500 });
  }
}

//? POST /api/packaging  (update si Adds[6] > 0, insert si no)
export async function POST(req) {
  try {
    const body = await req.json();
    const assemblyItem = Number(body.assemblyItem);
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }

    const toNumOptional = (v) => {
      if (v === "" || v == null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) throw new Error("Min/Nom/Max deben ser numéricos si se proporcionan");
      return n;
    };

    const min = toNumOptional(body.min);
    const nom = toNumOptional(body.nom);
    const max = toNumOptional(body.max);

    const capA = (body.capA ?? "").toString(); //* texto libre (espacios válidos)
    const capB = (body.capB ?? "").toString(); //* texto libre (espacios válidos)

    const pool = await getPool();

    //* Leer Adds
    const a = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!a.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const adds = splitAdds(a.recordset[0].Adds);
    const currentItem = adds[PACKAGING_INDEX] || 0;

    if (currentItem > 0) {
      //? UPDATE (item no cambia)
      await pool
        .request()
        .input("it", MSSQL.Int, currentItem)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("capa", MSSQL.NVarChar, capA)
        .input("capb", MSSQL.NVarChar, capB)
        .query(`
          UPDATE [dbo].[Packaging]
             SET [Min]=@min, [Nom]=@nom, [Max]=@max, [CapA]=@capa, [CapB]=@capb
           WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        packaging: { item: currentItem, min, nom, max, capA, capB },
        assembly: { item: assemblyItem, adds: joinAdds(adds) },
      });
    }

    //? INSERT (Item requerido)
    const item = Number(body.item);
    if (!Number.isFinite(item) || item <= 0) {
      return NextResponse.json({ ok: false, error: "Item (>0) es obligatorio al crear" }, { status: 400 });
    }

    //? Calcular Folio
    const f = await pool.request().query(`SELECT ISNULL(MAX([Folio]),0) + 1 AS nextFolio FROM [dbo].[Packaging]`);
    const folio = f.recordset[0]?.nextFolio || 1;

    await pool
      .request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("capa", MSSQL.NVarChar, capA)
      .input("capb", MSSQL.NVarChar, capB)
      .query(`
        INSERT INTO [dbo].[Packaging]
          ([Folio],[Item],[Min],[Nom],[Max],[CapA],[CapB])
        VALUES (@folio, @it, @min, @nom, @max, @capa, @capb)
      `);

    //? Guardar en Adds[6]
    adds[PACKAGING_INDEX] = item;
    await pool
      .request()
      .input("adds", MSSQL.NVarChar, joinAdds(adds))
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@aitem`);

    return NextResponse.json({
      ok: true,
      mode: "insert",
      packaging: { item, min, nom, max, capA, capB, folio },
      assembly: { item: assemblyItem, adds: joinAdds(adds) },
    });
  } catch (err) {
    console.error("[packaging][POST] error:", err);
    const msg = err?.message || "Error al guardar Packaging";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
