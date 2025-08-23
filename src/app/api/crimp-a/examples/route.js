import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();
    const q = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS cnt
      FROM [dbo].[CrimpA]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    const [cItems, cFitting, cDies, cCrimp] = await Promise.all([
      pool.request().query(q("[Item]")),
      pool.request().query(q("[Fitting]")),
      pool.request().query(q("[Dies]")),
      pool.request().query(q("[Crimp]")),
    ]);

    const items   = (cItems.recordset   || []).map(r => r.v);
    const fittings= (cFitting.recordset || []).map(r => r.v);
    const dies    = (cDies.recordset    || []).map(r => r.v);
    const crimps  = (cCrimp.recordset   || []).map(r => r.v);

    return NextResponse.json({ ok: true, items, fittings, dies, crimps });
  } catch (err) {
    console.error("[crimp-a/examples][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar ejemplos de Crimp A" },
      { status: 500 }
    );
  }
}
