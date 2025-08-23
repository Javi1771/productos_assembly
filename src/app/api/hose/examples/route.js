import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql"; 

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();

    //* Para columnas de texto
    const qText = (col) => `
      SELECT TOP 8 ${col} AS v, COUNT(*) AS cnt
      FROM [dbo].[Hose]
      WHERE ${col} IS NOT NULL AND LTRIM(RTRIM(${col})) <> ''
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    //* Para columna numérica (Item): casteamos a texto solo para agrupar y contar
    const qNum = (col) => `
      SELECT TOP 8 CAST(${col} AS NVARCHAR(50)) AS v, COUNT(*) AS cnt
      FROM [dbo].[Hose]
      WHERE ${col} IS NOT NULL
      GROUP BY ${col}
      ORDER BY COUNT(*) DESC
    `;

    const [i, d, c] = await Promise.all([
      pool.request().query(qNum("[Item]")),
      pool.request().query(qText("[Description]")),
      pool.request().query(qText("[Clea]")),
    ]);

    const items = (i.recordset || [])
      .map((r) => Number(r.v))
      .filter((n) => Number.isFinite(n));

    const descriptions = (d.recordset || []).map((r) => r.v);
    const cleas = (c.recordset || []).map((r) => r.v);

    return NextResponse.json({ ok: true, items, descriptions, cleas });
  } catch (err) {
    console.error("[hose/examples][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar ejemplos" },
      { status: 500 }
    );
  }
}
