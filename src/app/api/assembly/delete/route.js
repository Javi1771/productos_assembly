import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const rawItem = body?.item;
    const dryRun = Boolean(body?.dryRun);

    const item = Number(rawItem);
    if (!Number.isFinite(item) || item <= 0) {
      return NextResponse.json({ ok: false, error: "Falta 'item' válido" }, { status: 400 });
    }

    //* Comprobación mínima de sesión (igual que el código anterior)
    const cookieStore = await cookies();
    const rawNomina = cookieStore.get("u_nomina")?.value ?? "";
    const decodedNomina = rawNomina ? decodeURIComponent(rawNomina) : "";
    const nominaFromCookie = Number(decodedNomina);
    if (!Number.isFinite(nominaFromCookie)) {
      return NextResponse.json(
        { ok: false, code: "NO_NOMINA", error: "No hay nómina en tu sesión. Inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    const pool = await getPool();

    //? 1) Obtener Adds del Assembly
    const a = await pool
      .request()
      .input("item", MSSQL.Int, item)
      .query(`SELECT [Adds] FROM [dbo].[Assembly] WHERE [Item] = @item`);

    if (!a.recordset.length) {
      return NextResponse.json({ ok: false, error: "Assembly no encontrado" }, { status: 404 });
    }

    const addsStr = String(a.recordset[0].Adds ?? "");
    const parts = addsStr.split("|").map((p) => {
      const n = Number((p ?? "").trim());
      return Number.isFinite(n) && n > 0 ? n : 0;
    });
    //? Índices: 0 Hose, 1 Sleeve, 2 CrimpA, 3 CollarA, 4 CrimpB, 5 CollarB, 6 Packaging
    const hoseItem      = parts[0] || 0;
    const sleeveItem    = parts[1] || 0;
    const crimpAItem    = parts[2] || 0;
    const collarAItem   = parts[3] || 0;
    const crimpBItem    = parts[4] || 0;
    const collarBItem   = parts[5] || 0;
    const packagingItem = parts[6] || 0;

    //? 2) Ejecutar transacción de borrado (o dry run) y devolver conteos
    const sql = `
      SET NOCOUNT ON;
      SET XACT_ABORT ON;

      DECLARE
        @H INT = @hoseItem,
        @S INT = @sleeveItem,
        @CA INT = @crimpAItem,
        @CAA INT = @collarAItem,
        @CB INT = @crimpBItem,
        @CBB INT = @collarBItem,
        @P INT = @packagingItem,
        @Asm INT = @asmItem,
        @DRY BIT = @dryRun;

      DECLARE
        @cH INT = 0, @cS INT = 0, @cCA INT = 0, @cCAA INT = 0, @cCB INT = 0, @cCBB INT = 0, @cP INT = 0, @cAsm INT = 0;

      BEGIN TRY
        BEGIN TRAN;

        -- Precuentas (solo informativas en dryRun)
        SELECT
          @cH = (SELECT COUNT(*) FROM dbo.Hose      WHERE Item = @H AND @H > 0),
          @cS = (SELECT COUNT(*) FROM dbo.Sleeve    WHERE Item = @S AND @S > 0),
          @cCA = (SELECT COUNT(*) FROM dbo.CrimpA   WHERE Item = @CA AND @CA > 0),
          @cCAA = (SELECT COUNT(*) FROM dbo.CollarA WHERE Item = @CAA AND @CAA > 0),
          @cCB = (SELECT COUNT(*) FROM dbo.CrimpB   WHERE Item = @CB AND @CB > 0),
          @cCBB = (SELECT COUNT(*) FROM dbo.CollarB WHERE Item = @CBB AND @CBB > 0),
          @cP = (SELECT COUNT(*) FROM dbo.Packaging WHERE Item = @P AND @P > 0),
          @cAsm = (SELECT COUNT(*) FROM dbo.Assembly WHERE Item = @Asm);

        IF (@DRY = 0)
        BEGIN
          IF (@H > 0)   DELETE FROM dbo.Hose      WHERE Item = @H;
          IF (@S > 0)   DELETE FROM dbo.Sleeve    WHERE Item = @S;
          IF (@CA > 0)  DELETE FROM dbo.CrimpA    WHERE Item = @CA;
          IF (@CAA > 0) DELETE FROM dbo.CollarA   WHERE Item = @CAA;
          IF (@CB > 0)  DELETE FROM dbo.CrimpB    WHERE Item = @CB;
          IF (@CBB > 0) DELETE FROM dbo.CollarB   WHERE Item = @CBB;
          IF (@P > 0)   DELETE FROM dbo.Packaging WHERE Item = @P;
          DELETE FROM dbo.Assembly WHERE Item = @Asm;
        END

        IF (@DRY = 1)
        BEGIN
          ROLLBACK TRAN;
        END
        ELSE
        BEGIN
          COMMIT TRAN;
        END

        SELECT
          @cH  AS hose,
          @cS  AS sleeve,
          @cCA AS crimpA,
          @cCAA AS collarA,
          @cCB AS crimpB,
          @cCBB AS collarB,
          @cP  AS packaging,
          @cAsm AS assembly;
      END TRY
      BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRAN;
        THROW;
      END CATCH
    `;

    const result = await pool
      .request()
      .input("hoseItem", MSSQL.Int, hoseItem)
      .input("sleeveItem", MSSQL.Int, sleeveItem)
      .input("crimpAItem", MSSQL.Int, crimpAItem)
      .input("collarAItem", MSSQL.Int, collarAItem)
      .input("crimpBItem", MSSQL.Int, crimpBItem)
      .input("collarBItem", MSSQL.Int, collarBItem)
      .input("packagingItem", MSSQL.Int, packagingItem)
      .input("asmItem", MSSQL.Int, item)
      .input("dryRun", MSSQL.Bit, dryRun ? 1 : 0)
      .query(sql);

    const counters = result.recordset?.[0] ?? {
      hose: 0, sleeve: 0, crimpA: 0, collarA: 0, crimpB: 0, collarB: 0, packaging: 0, assembly: 0,
    };

    return NextResponse.json({
      ok: true,
      mode: dryRun ? "dryRun" : "deleted",
      item,
      deleted: counters,
      addsParsed: {
        hoseItem, sleeveItem, crimpAItem, collarAItem, crimpBItem, collarBItem, packagingItem,
      },
    });
  } catch (err) {
    console.error("[assembly/delete][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo eliminar el assembly y sus módulos" },
      { status: 500 }
    );
  }
}
