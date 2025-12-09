import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

export async function POST(request) {
  let pool;

  try {
    const data = await request.json();

    //* Validaciones básicas
    if (!data) {
      return NextResponse.json(
        { error: "No se recibieron datos" },
        { status: 400 }
      );
    }

    //* Conectar a la base de datos
    pool = await getPool();

    //? 1. Insertar en la tabla principal Calidad
    const calidadQuery = `
      INSERT INTO Calidad (
        LongitudRealVSDibujo,
        AnguloOrientacion,
        DiametroCrimpA,
        DiametroCrimpB,
        LongitudTotalVSDibujo,
        TipoManga,
        DescripcionManga,
        TipoManguera,
        DescripcionManguera,
        MetodoEmpaque,
        Cliente,
        CortadoraAjustada,
        DescripcionDibujo,
        EtiquetaA,
        EtiquetaB,
        Cintas,
        SCRAP,
        Sobrante
      )
      OUTPUT INSERTED.CalidadID
      VALUES (
        @LongitudRealVSDibujo,
        @AnguloOrientacion,
        @DiametroCrimpA,
        @DiametroCrimpB,
        @LongitudTotalVSDibujo,
        @TipoManga,
        @DescripcionManga,
        @TipoManguera,
        @DescripcionManguera,
        @MetodoEmpaque,
        @Cliente,
        @CortadoraAjustada,
        @DescripcionDibujo,
        @EtiquetaA,
        @EtiquetaB,
        @Cintas,
        @SCRAP,
        @Sobrante
      )
    `;

    const calidadResult = await pool
      .request()
      .input("LongitudRealVSDibujo", MSSQL.NVarChar(50), data.longitudRealVSDibujo || null)
      .input("AnguloOrientacion", MSSQL.NVarChar(50), data.anguloOrientacion || null)
      .input("DiametroCrimpA", MSSQL.NVarChar(50), data.diametroCrimpA || null)
      .input("DiametroCrimpB", MSSQL.NVarChar(50), data.diametroCrimpB || null)
      .input("LongitudTotalVSDibujo", MSSQL.NVarChar(50), data.longitudTotalVSDibujo || null)
      .input("TipoManga", MSSQL.Int, data.tipoManga)
      .input("DescripcionManga", MSSQL.NVarChar(200), data.descripcionManga || null)
      .input("TipoManguera", MSSQL.Int, data.tipoManguera)
      .input("DescripcionManguera", MSSQL.NVarChar(200), data.descripcionManguera || null)
      .input("MetodoEmpaque", MSSQL.Int, data.metodoEmpaque)
      .input("Cliente", MSSQL.NVarChar(100), data.cliente || null)
      .input("CortadoraAjustada", MSSQL.Bit, data.cortadoraAjustada || false)
      .input("DescripcionDibujo", MSSQL.NVarChar(500), data.descripcionDibujo || null)
      .input("EtiquetaA", MSSQL.NVarChar(100), data.etiquetaA || null)
      .input("EtiquetaB", MSSQL.NVarChar(100), data.etiquetaB || null)
      .input("Cintas", MSSQL.Bit, data.cintas || false)
      .input("SCRAP", MSSQL.Bit, data.scrap || false)
      .input("Sobrante", MSSQL.Bit, data.sobrante || false)
      .query(calidadQuery);

    const calidadID = calidadResult.recordset[0].CalidadID;

    //? 2. Insertar Cintas si aplica
    if (data.cintas && Array.isArray(data.cintas) && data.cintas.length > 0) {
      for (const cinta of data.cintas) {
        //! Solo insertar cintas que tengan al menos longitud o color
        if (cinta.longitud || cinta.color) {
          await pool
            .request()
            .input("CalidadID", MSSQL.Int, calidadID)
            .input("NumeroCinta", MSSQL.Int, cinta.numeroCinta)
            .input("Longitud", MSSQL.NVarChar(50), cinta.longitud || null)
            .input("Color", MSSQL.NVarChar(50), cinta.color || null)
            .query(`
              INSERT INTO CalidadCintas (CalidadID, NumeroCinta, Longitud, Color)
              VALUES (@CalidadID, @NumeroCinta, @Longitud, @Color)
            `);
        }
      }
    }

    //? 3. Insertar SCRAP si aplica
    if (data.scrap && Array.isArray(data.scrap) && data.scrap.length > 0) {
      for (const scrapItem of data.scrap) {
        //! Solo insertar items que tengan al menos cantidad o código
        if (scrapItem.cantidad || scrapItem.codigo) {
          await pool
            .request()
            .input("CalidadID", MSSQL.Int, calidadID)
            .input("Cantidad", MSSQL.Int, scrapItem.cantidad ? parseInt(scrapItem.cantidad) : null)
            .input("Codigo", MSSQL.NVarChar(50), scrapItem.codigo || null)
            .query(`
              INSERT INTO CalidadSCRAP (CalidadID, Cantidad, Codigo)
              VALUES (@CalidadID, @Cantidad, @Codigo)
            `);
        }
      }
    }

    //? 4. Insertar Material Sobrante si aplica
    if (data.sobrante && Array.isArray(data.sobrante) && data.sobrante.length > 0) {
      for (const sobranteItem of data.sobrante) {
        //! Solo insertar items que tengan al menos itemSobrante o cantidad
        if (sobranteItem.itemSobrante || sobranteItem.cantidad) {
          await pool
            .request()
            .input("CalidadID", MSSQL.Int, calidadID)
            .input("ItemSobrante", MSSQL.NVarChar(50), sobranteItem.itemSobrante || null)
            .input("Cantidad", MSSQL.Int, sobranteItem.cantidad ? parseInt(sobranteItem.cantidad) : null)
            .input("MotivoRetorno", MSSQL.NVarChar(200), sobranteItem.motivoRetorno || null)
            .query(`
              INSERT INTO CalidadMaterialSobrante (CalidadID, ItemSobrante, Cantidad, MotivoRetorno)
              VALUES (@CalidadID, @ItemSobrante, @Cantidad, @MotivoRetorno)
            `);
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Registro de calidad guardado exitosamente",
        calidadID: calidadID,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/calidad:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Error al guardar el registro de calidad",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

//* GET para consultar registros de calidad
export async function GET(request) {
  try {
    const pool = await getPool();

    const { searchParams } = new URL(request.url);
    const calidadID = searchParams.get("id");

    if (calidadID) {
      //* Consultar un registro específico con todos sus detalles
      const calidad = await pool
        .request()
        .input("CalidadID", MSSQL.Int, calidadID)
        .query(`SELECT * FROM Calidad WHERE CalidadID = @CalidadID`);

      const cintas = await pool
        .request()
        .input("CalidadID", MSSQL.Int, calidadID)
        .query(`SELECT * FROM CalidadCintas WHERE CalidadID = @CalidadID ORDER BY NumeroCinta`);

      const scrap = await pool
        .request()
        .input("CalidadID", MSSQL.Int, calidadID)
        .query(`SELECT * FROM CalidadSCRAP WHERE CalidadID = @CalidadID`);

      const sobrante = await pool
        .request()
        .input("CalidadID", MSSQL.Int, calidadID)
        .query(`SELECT * FROM CalidadMaterialSobrante WHERE CalidadID = @CalidadID`);

      if (calidad.recordset.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Registro no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        calidad: calidad.recordset[0],
        cintas: cintas.recordset,
        scrap: scrap.recordset,
        sobrante: sobrante.recordset,
      });
    } else {
      //* Consultar todos los registros (resumen)
      const result = await pool.request().query(`
        SELECT 
          CalidadID,
          Cliente,
          LongitudRealVSDibujo,
          DiametroCrimpA,
          DiametroCrimpB,
          Cintas,
          SCRAP,
          Sobrante,
          CortadoraAjustada
        FROM Calidad
        ORDER BY CalidadID DESC
      `);

      return NextResponse.json({
        ok: true,
        registros: result.recordset,
        total: result.recordset.length,
      });
    }
  } catch (error) {
    console.error("Error en GET /api/calidad:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Error al consultar registros de calidad",
        details: error.message,
      },
      { status: 500 }
    );
  }
}