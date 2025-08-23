import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();

    const q = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS c
      FROM [dbo].[CrimpB]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    const [i, dsc, d, c, cv] = await Promise.all([
      pool.request().query(q("[Item]")),
      pool.request().query(q("[Description]")),
      pool.request().query(q("[Dies]")),
      pool.request().query(q("[Crimp]")),
      pool.request().query(q("[Curv]")),
    ]);

    const items        = (i.recordset || []).map((r) => String(r.v));
    const descriptions = (dsc.recordset || []).map((r) => String(r.v));
    const dies         = (d.recordset || []).map((r) => String(r.v));
    const crimps       = (c.recordset || []).map((r) => String(r.v));
    const curvs        = (cv.recordset || []).map((r) => String(r.v));

    return NextResponse.json({ ok: true, items, descriptions, dies, crimps, curvs });
  } catch (err) {
    console.error("[crimp-b/examples][GET] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudieron cargar ejemplos" }, { status: 500 });
  }
}
