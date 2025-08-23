import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Helpers para manejar Adds
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

/*
 * GET /api/sleeve?assemblyItem=###
 * Devuelve el Sleeve asociado al Assembly (según Adds[1]) si existe:
 * { ok:true, sleeve: { Item,Sleeve,Min,Max,Nom } | null }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: true, sleeve: null });
    }

    const pool = await getPool();

    //* Obtener Adds del assembly
    const ares = await pool
      .request()
      .input("item", MSSQL.Int, assemblyItem)
      .query(`
        SELECT TOP 1 [Adds]
        FROM [dbo].[Assembly]
        WHERE [Item] = @item
      `);

    if (!ares.recordset.length) {
      return NextResponse.json({ ok: true, sleeve: null });
    }

    const adds = splitAdds(ares.recordset[0].Adds);
    const sleeveItem = adds[1] || 0; //* 2a posición (index 1)

    if (!sleeveItem) {
      return NextResponse.json({ ok: true, sleeve: null });
    }

    //* Tomamos el registro por Item
    const sres = await pool
      .request()
      .input("sitem", MSSQL.Int, sleeveItem)
      .query(`
        SELECT TOP 1 [Item],[Sleeve],[Min],[Max],[Nom]
        FROM [dbo].[Sleeve]
        WHERE [Item] = @sitem
        ORDER BY [Folio] DESC
      `);

    const sleeve = sres.recordset[0] || null;
    return NextResponse.json({ ok: true, sleeve });
  } catch (err) {
    console.error("[sleeve][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al obtener Sleeve" },
      { status: 500 }
    );
  }
}

/*
 * POST /api/sleeve
 * Body: { assemblyItem, item?, sleeve?, min, max, nom }
 * - Inserta si Adds[1] está vacío (o 0). Actualiza si ya había uno.
 * - Si viene `item` (>0), lo escribe en Adds[1].
 * - Min/Nom/Max SON OBLIGATORIOS cuando se guarda este formulario.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const assemblyItem = Number(body.assemblyItem);
    const item = body.item == null || body.item === ""
      ? null
      : Number(body.item);
    const sleeve = body.sleeve == null || body.sleeve === "" ? null : String(body.sleeve).trim();

    const min = body.min == null || body.min === "" ? null : Number(body.min);
    const max = body.max == null || body.max === "" ? null : Number(body.max);
    const nom = body.nom == null || body.nom === "" ? null : Number(body.nom);

    if (!assemblyItem || Number.isNaN(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "assemblyItem inválido" }, { status: 400 });
    }
    //! Reglas: min/max/nom obligatorios si se guarda
    if ([min, max, nom].some((v) => v == null || Number.isNaN(v))) {
      return NextResponse.json(
        { ok: false, error: "Min, Max y Nom son requeridos" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    //? 1) obtener Adds actual
    const ares = await pool
      .request()
      .input("aitem", MSSQL.Int, assemblyItem)
      .query(`
        SELECT TOP 1 [Adds]
        FROM [dbo].[Assembly]
        WHERE [Item] = @aitem
      `);

    if (!ares.recordset.length) {
      return NextResponse.json(
        { ok: false, error: "Assembly no encontrado" },
        { status: 404 }
      );
    }

    const addsParts = splitAdds(ares.recordset[0].Adds);
    const currentSleeveItem = addsParts[1] || 0;

    if (currentSleeveItem > 0) {
      //? 2) UPDATE por Item (bloqueamos Item; no lo cambiamos)
      await pool
        .request()
        .input("it", MSSQL.Int, currentSleeveItem)
        .input("sv", MSSQL.NVarChar, sleeve)
        .input("min", MSSQL.Decimal(18, 6), min)
        .input("max", MSSQL.Decimal(18, 6), max)
        .input("nom", MSSQL.Decimal(18, 6), nom)
        .query(`
          UPDATE [dbo].[Sleeve]
          SET [Sleeve] = @sv, [Min] = @min, [Max] = @max, [Nom] = @nom
          WHERE [Item] = @it
        `);

      return NextResponse.json({
        ok: true,
        mode: "update",
        sleeve: { item: currentSleeveItem, sleeve, min, max, nom },
        assembly: { item: assemblyItem, adds: joinAdds(addsParts) },
      });
    }

    //? 3) INSERT nuevo: calcular Folio
    const fres = await pool.request().query(`SELECT ISNULL(MAX([Folio]), 0) + 1 AS nextFolio FROM [dbo].[Sleeve]`);
    const folio = fres.recordset[0]?.nextFolio || 1;

    await pool
      .request()
      .input("folio", MSSQL.Int, folio)
      .input("it", MSSQL.Int, item)  // puede ser null
      .input("sv", MSSQL.NVarChar, sleeve)
      .input("min", MSSQL.Decimal(18, 6), min)
      .input("max", MSSQL.Decimal(18, 6), max)
      .input("nom", MSSQL.Decimal(18, 6), nom)
      .query(`
        INSERT INTO [dbo].[Sleeve] ([Folio],[Item],[Sleeve],[Min],[Max],[Nom])
        VALUES (@folio, @it, @sv, @min, @max, @nom)
      `);

    //? 4) Si vino item (>0), actualizar Adds[1]
    if (item && item > 0) {
      addsParts[1] = item;
      await pool
        .request()
        .input("adds", MSSQL.NVarChar, joinAdds(addsParts))
        .input("aitem", MSSQL.Int, assemblyItem)
        .query(`
          UPDATE [dbo].[Assembly]
          SET [Adds] = @adds
          WHERE [Item] = @aitem
        `);
    }

    return NextResponse.json({
      ok: true,
      mode: "insert",
      sleeve: { item, sleeve, min, max, nom, folio },
      assembly: { item: assemblyItem, adds: joinAdds(addsParts) },
    });
  } catch (err) {
    console.error("[sleeve][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "Error al guardar Sleeve" },
      { status: 500 }
    );
  }
}
