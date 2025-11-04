import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

/*
 * GET /api/jobs
 * Retorna todos los jobs de la tabla [dbo].[Job]
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const pool = await getPool();

    //* Construir query con búsqueda opcional
    let whereClause = "";
    if (search) {
      whereClause = `
        WHERE 
          CAST([Folio] AS VARCHAR) LIKE '%${search}%' OR
          [JOB] LIKE '%${search}%' OR
          [Item] LIKE '%${search}%' OR
          [Linea] LIKE '%${search}%'
      `;
    }

    //* Contar total de registros
    const countQuery = `SELECT COUNT(*) as total FROM [dbo].[Job] ${whereClause}`;
    const countResult = await pool.request().query(countQuery);
    const total = countResult.recordset[0].total;

    //* Obtener registros paginados
    const dataQuery = `
      SELECT 
        [Folio],
        [JOB],
        [Item],
        [Linea],
        [QtyTot],
        [QtyReal],
        [Fecha],
        [Estatus]
      FROM [dbo].[Job]
      ${whereClause}
      ORDER BY [Fecha] DESC, [Folio] DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${limit} ROWS ONLY
    `;
    
    const dataResult = await pool.request().query(dataQuery);

    const jobs = dataResult.recordset.map((row) => ({
      folio: row.Folio,
      job: row.JOB,
      item: row.Item,
      linea: row.Linea,
      qtyTot: row.QtyTot,
      qtyReal: row.QtyReal,
      fecha: row.Fecha,
      estatus: row.Estatus,
    }));

    return NextResponse.json({
      ok: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[jobs][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo cargar los jobs" },
      { status: 500 }
    );
  }
}