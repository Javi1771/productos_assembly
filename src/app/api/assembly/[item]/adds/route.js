import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";
import { ADDS_ORDER } from "@/app/api/assembly/route";

export const runtime = "nodejs";

/*
 * PATCH /api/assembly/:item/adds
 * body: { module?: string, index?: number, subId: string|number }
 *   - Usa "module" con uno de ADDS_ORDER o "index" (0..6)
 *   - subId = id de la fila creada en el formulario opcional
 */
export async function PATCH(_req, { params }) {
  const item = Number(params.item);
  let payload = {};
  try {
    payload = await _req.json();
  } catch {}

  const { module, index, subId } = payload;

  if (!item || (!module && typeof index !== "number") || (subId === undefined || subId === null)) {
    return NextResponse.json(
      { ok: false, error: "Faltan parámetros: item y (module|index) y subId" },
      { status: 400 }
    );
  }

  const idx = typeof index === "number" ? index : ADDS_ORDER.findIndex(m => m === module);
  if (idx < 0 || idx >= ADDS_ORDER.length) {
    return NextResponse.json(
      { ok: false, error: "Índice o módulo inválido" },
      { status: 400 }
    );
  }

  const pool = await getPool();
  const tx = new MSSQL.Transaction(pool);

  try {
    await tx.begin();

    //? 1) Leer Adds con bloqueo de fila
    const sel = await new MSSQL.Request(tx)
      .input("Item", MSSQL.Int, item)
      .query(`
        SELECT [Adds]
        FROM [dbo].[Assembly] WITH (ROWLOCK, UPDLOCK)
        WHERE [Item] = @Item
      `);

    if (!sel.recordset.length) {
      await tx.rollback();
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    //? 2) Normalizar arreglo
    const current = String(sel.recordset[0].Adds ?? "");
    let parts = current.split("|").filter(() => true);
    //* Asegurar longitud exacta
    if (parts.length < ADDS_ORDER.length) {
      parts = [...parts, ...Array(ADDS_ORDER.length - parts.length).fill("0")];
    } else if (parts.length > ADDS_ORDER.length) {
      parts = parts.slice(0, ADDS_ORDER.length);
    }

    //? 3) Actualizar posición
    parts[idx] = String(subId ?? "0");
    const newAdds = parts.join("|");

    //? 4) Guardar
    await new MSSQL.Request(tx)
      .input("Item", MSSQL.Int, item)
      .input("Adds", MSSQL.NVarChar(400), newAdds)
      .query(`
        UPDATE [dbo].[Assembly]
        SET [Adds] = @Adds
        WHERE [Item] = @Item
      `);

    await tx.commit();

    return NextResponse.json({ ok: true, item, adds: newAdds, index: idx, module: ADDS_ORDER[idx] });
  } catch (err) {
    try { await tx.rollback(); } catch {}
    console.error("[adds][PATCH] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar Adds" }, { status: 500 });
  }
}

//* GET /api/assembly/:item/adds -> estado actual de Adds */
export async function GET(_req, { params }) {
  const item = Number(params.item);
  if (!item) {
    return NextResponse.json({ ok: false, error: "Item inválido" }, { status: 400 });
  }
  try {
    const pool = await getPool();
    const q = await pool.request()
      .input("Item", MSSQL.Int, item)
      .query(`
        SELECT [Adds]
        FROM [dbo].[Assembly]
        WHERE [Item] = @Item
      `);
    if (!q.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }
    const adds = String(q.recordset[0].Adds ?? "");
    return NextResponse.json({ ok: true, item, adds, order: ADDS_ORDER });
  } catch (err) {
    console.error("[adds][GET] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo leer Adds" }, { status: 500 });
  }
}
