import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();

    const q = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS cnt
      FROM [dbo].[Sleeve]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    const [c1, c2] = await Promise.all([
      pool.request().query(q("[Item]")),
      pool.request().query(q("[Sleeve]")),
    ]);

    const items = (c1.recordset || []).map((r) => r.v);
    const sleeves = (c2.recordset || []).map((r) => r.v);

    return NextResponse.json({ ok: true, items, sleeves });
  } catch (err) {
    console.error("[sleeve/examples][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar ejemplos de Sleeve" },
      { status: 500 }
    );
  }
}
