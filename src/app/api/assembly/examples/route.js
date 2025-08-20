import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();
    const q = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS cnt
      FROM [dbo].[Assembly]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;
    const [c1, c2, c3] = await Promise.all([
      pool.request().query(q("[Customer]")),
      pool.request().query(q("[NCI]")),
      pool.request().query(q("[CustomerRev]")),
    ]);
    const customers = (c1.recordset || []).map((r) => r.v);
    const ncis = (c2.recordset || []).map((r) => r.v);
    const customerRevs = (c3.recordset || []).map((r) => r.v);

    return NextResponse.json({ ok: true, customers, ncis, customerRevs });
  } catch (err) {
    console.error("[assembly/examples][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar ejemplos" },
      { status: 500 }
    );
  }
}
