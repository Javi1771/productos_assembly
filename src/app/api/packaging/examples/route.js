import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();
    const q = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS c
      FROM [dbo].[Packaging]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    const [i, a, b] = await Promise.all([
      pool.request().query(q("[Item]")),
      pool.request().query(q("[CapA]")),
      pool.request().query(q("[CapB]")),
    ]);

    const items = (i.recordset || []).map((r) => String(r.v));
    const capA  = (a.recordset || []).map((r) => String(r.v));
    const capB  = (b.recordset || []).map((r) => String(r.v));

    return NextResponse.json({ ok: true, items, capA, capB });
  } catch (err) {
    console.error("[packaging/examples][GET] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudieron cargar ejemplos" }, { status: 500 });
  }
}
