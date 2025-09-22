import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { item, aprobado } = body || {};

    //* Normaliza aprobado a 0/1
    const aprobadoNum =
      aprobado === true || aprobado === 1 || aprobado === "1" ? 1 : 0;

    if (item === undefined || item === null) {
      return NextResponse.json(
        { ok: false, error: "Falta 'item'" },
        { status: 400 }
      );
    }

    //* NEXT dynamic API: await cookies()
    const cookieStore = await cookies();
    const rawNomina = cookieStore.get("u_nomina")?.value ?? "";
    const decodedNomina = rawNomina ? decodeURIComponent(rawNomina) : "";
    const nominaFromCookie = Number(decodedNomina);

    //! ❗ Reglas:
    //! - Si quieren APROBAR (1) y NO hay nómina válida → rechazar
    //! - Si quieren DESAPROBAR (0) → permitir aunque no haya nómina
    if (aprobadoNum === 1 && !Number.isFinite(nominaFromCookie)) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_NOMINA",
          error:
            "No se puede aprobar porque no hay nómina en tu sesión. Por favor, inicia sesión nuevamente.",
        },
        { status: 401 }
      );
    }

    const aprobadoPorId =
      aprobadoNum === 1 ? nominaFromCookie : null;

    const pool = await getPool();
    const sql = `
      UPDATE [dbo].[Assembly]
      SET
        Aprobado      = @aprobado,
        AprobadoPorId = CASE WHEN @aprobado = 1 THEN @aprobadoPorId ELSE NULL END,
        AprobadoEn    = CASE WHEN @aprobado = 1 THEN SYSDATETIME() ELSE NULL END
      WHERE Item = @item
    `;

    await pool
      .request()
      .input("aprobado", aprobadoNum)
      .input("aprobadoPorId", aprobadoNum === 1 ? aprobadoPorId : null)
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
