import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Adds indices:
//* 0: Hose, 1: Sleeve/Guard, 2: CrimpA, 3: CollarA, 4: CrimpB, 5: CollarB, 6: Packaging
const COLLARB_INDEX = 5;

function splitAdds(addsStr) {
  const parts = String(addsStr || "")
    .split("|")
    .map((p) => (p && /^\d+$/.test(p) ? Number(p) : 0));
  while (parts.length <= COLLARB_INDEX) parts.push(0);
  return parts;
}
function joinAdds(parts) {
  return parts.map((n) => (Number(n) > 0 ? String(n) : "0")).join("|");
}

//* GET /api/collar-b?assemblyItem=###
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, collarB: null });
    }

    const pool = await getPool();

    const ares = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) return NextResponse.json({ ok: true, collarB: null });

    const adds = splitAdds(ares.recordset[0].Adds);
    const collarBItem = adds[COLLARB_INDEX] || 0;
    if (!collarBItem) return NextResponse.json({ ok: true, collarB: null });

    const cres = await pool
      .request()
      .input("it", MSSQL.Int, collarBItem)
      .query(`
        SELECT TOP 1
          [Item],[Description],[Min],[Nom],[Max],[Dies],[Crimp]
        FROM [dbo].[CollarB]
        WHERE [Item] = @it
        ORDER BY [Folio] DESC
      `);

    const collarB = cres.recordset[0] || null;
    return NextResponse.json({ ok: true, collarB });
  } catch (err) {
    console.error("[collar-b][GET] error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener Collar B" }, { status: 500 });
  }
}

//* POST /api/collar-b (insert/update según Adds[5])
export async function POST(req) {
  try {
    const body = await req.json();
    const assemblyItem = Number(body.assemblyItem);
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }

    const toNumRequired = (v, name) => {
      if (v === "" || v == null || Number.isNaN(Number(v))) {
        throw new Error(`${name} es obligatorio y debe ser numérico`);
      }
      return Number(v);
    };

    const pool = await getPool();

    //? Leer Adds
    const ares = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`SELECT TOP 1 [Adds] FROM [dbo].[Assembly] WHERE [Item] = @aitem`);

    if (!ares.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const adds = splitAdds(ares.recordset[0].Adds);
    const currentItem = adds[COLLARB_INDEX] || 0;

    //? Datos del body (todos obligatorios en CollarB)
    const description = (body.description ?? "").toString().trim().toUpperCase();
    const dies        = (body.dies ?? "").toString().trim().toUpperCase();
    const crimp       = (body.crimp ?? "").toString().trim().toUpperCase();

    if (!description) return NextResponse.json({ ok: false, error: "Description es obligatoria" }, { status: 400 });
    if (!dies) return NextResponse.json({ ok: false, error: "Dies es obligatorio" }, { status: 400 });
    if (!crimp) return NextResponse.json({ ok: false, error: "Crimp es obligatorio" }, { status: 400 });

    const min = toNumRequired(body.min, "Min");
    const nom = toNumRequired(body.nom, "Nom");
    const max = toNumRequired(body.max, "Max");

    if (currentItem > 0) {
      //? UPDATE (item NO cambia)
      await pool
        .request()
        .input("it", MSSQL.Int, currentItem)
        .input("desc", MSSQL.NVarChar, description)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("dies", MSSQL.NVarChar, dies)
        .input("crimp", MSSQL.NVarChar, crimp)
        .query(`
          UPDATE [dbo].[CollarB]
            SET [Description]=@desc, [Min]=@min, [Nom]=@nom, [Max]=@max,
                [Dies]=@dies, [Crimp]=@crimp
          WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        collarB: { item: currentItem, description, min, nom, max, dies, crimp },
        assembly: { item: assemblyItem, adds: joinAdds(adds) },
      });
    }

    //? INSERT (Item requerido)
    const item = Number(body.item);
    if (!Number.isFinite(item) || item <= 0) {
      return NextResponse.json({ ok: false, error: "Item (>0) es obligatorio al crear" }, { status: 400 });
    }

    //? Calcular Folio
    const f = await pool.request().query(`SELECT ISNULL(MAX([Folio]),0) + 1 AS nextFolio FROM [dbo].[CollarB]`);
    const folio = f.recordset[0]?.nextFolio || 1;

    await pool
      .request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)
      .input("desc", MSSQL.NVarChar, description)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("dies", MSSQL.NVarChar, dies)
      .input("crimp", MSSQL.NVarChar, crimp)
      .query(`
        INSERT INTO [dbo].[CollarB]
        ([Folio],[Item],[Description],[Min],[Nom],[Max],[Dies],[Crimp])
        VALUES (@folio, @it, @desc, @min, @nom, @max, @dies, @crimp)
      `);

    //? Guardar Item en Adds[5]
    adds[COLLARB_INDEX] = item;
    await pool
      .request()
      .input("adds", MSSQL.NVarChar, joinAdds(adds))
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@aitem`);

    return NextResponse.json({
      ok: true,
      mode: "insert",
      collarB: { item, description, min, nom, max, dies, crimp, folio },
      assembly: { item: assemblyItem, adds: joinAdds(adds) },
    });
  } catch (err) {
    console.error("[collar-b][POST] error:", err);
    const msg = err?.message || "Error al guardar Collar B";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
