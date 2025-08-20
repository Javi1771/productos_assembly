// src/app/api/assembly/route.js
import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

// Orden canónico de Adds (7 módulos)
export const ADDS_ORDER = [
  "Hose Cut",
  "Sleeve/Guard cut",
  "Crimp A",
  "CollarA",
  "Crimp B",
  "CollarB",
  "Packaging",
];

/** GET /api/assembly -> { nextItem } */
export async function GET() {
  try {
    const pool = await getPool();
    const res = await pool.request().query(`
      SELECT ISNULL(MAX(TRY_CAST([Item] AS INT)), 0) + 1 AS nextItem
      FROM [dbo].[Assembly]
      WHERE TRY_CAST([Item] AS INT) IS NOT NULL
    `);
    const nextItem = res.recordset?.[0]?.nextItem ?? 1;
    return NextResponse.json({ ok: true, nextItem });
  } catch (err) {
    console.error("[assembly][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo calcular el siguiente Item" },
      { status: 500 }
    );
  }
}

/** POST /api/assembly
 * body: { descripcion, customer, nci, customerRev }
 */
export async function POST(req) {
  const t0 = Date.now();
  const body = await req.json().catch(() => ({}));
  const { descripcion, customer, nci, customerRev } = body || {};

  if (!descripcion || !customer || !nci || !customerRev) {
    return NextResponse.json(
      { ok: false, error: "Faltan campos: descripcion, customer, nci, customerRev" },
      { status: 400 }
    );
  }

  const pool = await getPool();
  const tx = new MSSQL.Transaction(pool);

  // Adds por defecto: 7 posiciones en 0 (una por módulo)
  const defaultAdds = ADDS_ORDER.map(() => "0").join("|");

  try {
    await tx.begin();

    // Cálculo serializado del siguiente Item
    const lockReq = new MSSQL.Request(tx);
    const nextRes = await lockReq.query(`
      SELECT ISNULL(MAX(TRY_CAST([Item] AS INT)), 0) + 1 AS nextItem
      FROM [dbo].[Assembly] WITH (UPDLOCK, HOLDLOCK)
      WHERE TRY_CAST([Item] AS INT) IS NOT NULL
    `);
    const nextItem = nextRes.recordset?.[0]?.nextItem ?? 1;

    const insReq = new MSSQL.Request(tx);
    insReq
      .input("Item", MSSQL.Int, nextItem)
      .input("Descripcion", MSSQL.NVarChar(255), String(descripcion).trim())
      .input("Customer", MSSQL.NVarChar(100), String(customer).trim())
      .input("NCI", MSSQL.NVarChar(50), String(nci).trim())
      .input("CustomerRev", MSSQL.NVarChar(100), String(customerRev).trim())
      .input("Adds", MSSQL.NVarChar(400), defaultAdds);

    await insReq.query(`
      INSERT INTO [dbo].[Assembly] ([Item], [Description], [Customer], [NCI], [CustomerRev], [Adds])
      VALUES (@Item, @Descripcion, @Customer, @NCI, @CustomerRev, @Adds)
    `);

    await tx.commit();

    console.log("[assembly][POST] creado:", {
      Item: nextItem,
      Adds: defaultAdds,
      ms: Date.now() - t0,
    });

    return NextResponse.json({
      ok: true,
      item: {
        Item: nextItem,
        Descripcion: String(descripcion).trim(),
        Customer: String(customer).trim(),
        NCI: String(nci).trim(),
        CustomerRev: String(customerRev).trim(),
        Adds: defaultAdds,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[assembly][POST] error:", err);
    try { await tx.rollback(); } catch {}
    return NextResponse.json(
      { ok: false, error: "No se pudo registrar el producto" },
      { status: 500 }
    );
  }
}
