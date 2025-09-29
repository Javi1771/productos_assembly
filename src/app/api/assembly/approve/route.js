import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { item, aprobado } = body || {};

    const aprobadoNum =
      aprobado === true || aprobado === 1 || aprobado === "1" ? 1 : 0;

    if (item === undefined || item === null) {
      return NextResponse.json(
        { ok: false, error: "Falta 'item'" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    //! Verificar el estado actual del registro
    const checkSql = `
      SELECT Aprobado, AprobadoPorId
      FROM [dbo].[Assembly]
      WHERE Item = @item
    `;
    const checkResult = await pool.request().input("item", item).query(checkSql);
    
    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No se encontró el registro" },
        { status: 404 }
      );
    }

    const registro = checkResult.recordset[0];
    
    //! Si ya tiene un estado final (AprobadoPorId no es null), no permitir cambios
    if (registro.AprobadoPorId !== null) {
      const estadoActual = registro.Aprobado === 1 ? "aprobado" : "rechazado";
      return NextResponse.json(
        {
          ok: false,
          code: registro.Aprobado === 1 ? "REGISTRO_APROBADO" : "REGISTRO_RECHAZADO",
          error: `Este registro ya fue ${estadoActual} y no puede ser modificado.`
        },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const rawNomina = cookieStore.get("u_nomina")?.value ?? "";
    const decodedNomina = rawNomina ? decodeURIComponent(rawNomina) : "";
    const nominaFromCookie = Number(decodedNomina);

    if (!Number.isFinite(nominaFromCookie)) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_NOMINA",
          error: "No hay nómina en tu sesión. Por favor, inicia sesión nuevamente.",
        },
        { status: 401 }
      );
    }

    const sql = `
      UPDATE [dbo].[Assembly]
      SET
        Aprobado      = @aprobado,
        AprobadoPorId = @aprobadoPorId,
        AprobadoEn    = SYSDATETIME()
      WHERE Item = @item
    `;

    await pool
      .request()
      .input("aprobado", aprobadoNum)
      .input("aprobadoPorId", nominaFromCookie)
      .input("item", item)
      .query(sql);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[assembly/approve][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar la aprobación" },
      { status: 500 }
    );
  }
}