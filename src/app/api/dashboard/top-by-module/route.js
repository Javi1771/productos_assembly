import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

/*
 * GET /api/dashboard/top-by-module
 * 
 * Retorna el Top 10 de Items por CADA tabla independientemente
 * Tablas: Corte, Acabado, RCrimpA, RCrimpB
 */
export async function GET() {
  try {
    const pool = await getPool();

    //? Top 10 de Corte
    const queryCorte = `
      SELECT TOP 10
        LTRIM(RTRIM([Item])) AS Item,
        SUM([QtyR]) AS TotalQtyR,
        COUNT(*) AS TotalRecords
      FROM [dbo].[Corte]
      WHERE [Item] IS NOT NULL AND LTRIM(RTRIM([Item])) <> ''
      GROUP BY LTRIM(RTRIM([Item]))
      ORDER BY SUM([QtyR]) DESC
    `;

    //? Top 10 de Acabado
    const queryAcabado = `
      SELECT TOP 10
        LTRIM(RTRIM([Item])) AS Item,
        SUM([QtyR]) AS TotalQtyR,
        COUNT(*) AS TotalRecords
      FROM [dbo].[Acabado]
      WHERE [Item] IS NOT NULL AND LTRIM(RTRIM([Item])) <> ''
      GROUP BY LTRIM(RTRIM([Item]))
      ORDER BY SUM([QtyR]) DESC
    `;

    //? Top 10 de RCrimpA
    const queryCrimpA = `
      SELECT TOP 10
        LTRIM(RTRIM([Item])) AS Item,
        SUM([QtyR]) AS TotalQtyR,
        COUNT(*) AS TotalRecords
      FROM [dbo].[RCrimpA]
      WHERE [Item] IS NOT NULL AND LTRIM(RTRIM([Item])) <> ''
      GROUP BY LTRIM(RTRIM([Item]))
      ORDER BY SUM([QtyR]) DESC
    `;

    //? Top 10 de RCrimpB 
    const queryCrimpB = `
      SELECT TOP 10
        LTRIM(RTRIM([Item])) AS Item,
        SUM([QtyR]) AS TotalQtyR,
        COUNT(*) AS TotalRecords
      FROM [dbo].[RCrimpB]
      WHERE [Item] IS NOT NULL AND LTRIM(RTRIM([Item])) <> ''
      GROUP BY LTRIM(RTRIM([Item]))
      ORDER BY SUM([QtyR]) DESC
    `;

    //* Ejecutar todas las consultas
    const [resultCorte, resultAcabado, resultCrimpA, resultCrimpB] = await Promise.all([
      pool.request().query(queryCorte),
      pool.request().query(queryAcabado),
      pool.request().query(queryCrimpA),
      pool.request().query(queryCrimpB),
    ]);

    //* Mapear resultados
    const mapResults = (recordset) => 
      (recordset || []).map((r) => ({
        item: r.Item,
        totalQtyR: r.TotalQtyR || 0,
        totalRecords: r.TotalRecords || 0,
      }));

    const response = {
      ok: true,
      data: {
        corte: {
          name: "Corte",
          items: mapResults(resultCorte.recordset),
        },
        acabado: {
          name: "Acabado",
          items: mapResults(resultAcabado.recordset),
        },
        crimpA: {
          name: "RCrimp A",
          items: mapResults(resultCrimpA.recordset),
        },
        crimpB: {
          name: "RCrimp B",
          items: mapResults(resultCrimpB.recordset),
        },
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[dashboard/top-by-module][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar el Top 10 por módulo" },
      { status: 500 }
    );
  }
}