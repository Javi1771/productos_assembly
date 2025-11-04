import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    //* Leer el archivo Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    //* Parsear Excel
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    //* Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json(
        { ok: false, error: "El archivo está vacío o no tiene datos" },
        { status: 400 }
      );
    }

    //* Validar encabezados exactos
    const headers = jsonData[0];
    const expectedHeaders = ["Folio", "JOB", "Item", "Linea", "QtyTot", "QtyReal", "Fecha", "Estatus"];
    
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i] !== expectedHeaders[i]) {
        return NextResponse.json(
          { 
            ok: false, 
            error: `Encabezado incorrecto en columna ${String.fromCharCode(65 + i)}. Se esperaba "${expectedHeaders[i]}" pero se encontró "${headers[i] || 'vacío'}"` 
          },
          { status: 400 }
        );
      }
    }

    //* Obtener el último folio de la base de datos
    const pool = await getPool();
    const lastFolioResult = await pool.request()
      .query("SELECT MAX(CAST([Folio] AS INT)) as lastFolio FROM [dbo].[Job] WHERE ISNUMERIC([Folio]) = 1");
    
    let nextFolio = (lastFolioResult.recordset[0].lastFolio || 0) + 1;

    //* Procesar datos (desde fila 2 en adelante)
    const dataRows = jsonData.slice(1);
    
    let inserted = 0;
    let skipped = 0;
    let foliosAjustados = 0;
    const errors = [];
    const warnings = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; //* +2 porque empezamos en fila 2 del Excel

      //* Saltar filas completamente vacías
      if (!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === "")) {
        skipped++;
        continue;
      }

      try {
        let [folio, job, item, linea, qtyTot, qtyReal, fecha, estatus] = row;

        //? ========== VALIDACIONES DE DATOS ==========

        //? 1. Validar que Folio exista y sea válido
        if (!folio || folio === "") {
          errors.push({
            fila: rowNum,
            columna: "Folio (A)",
            error: "El Folio es obligatorio y no puede estar vacío"
          });
          continue;
        }

        //? 2. Verificar si el folio ya existe en la BD
        const checkResult = await pool.request()
          .input("folio", folio.toString())
          .query("SELECT COUNT(*) as count FROM [dbo].[Job] WHERE [Folio] = @folio");

        if (checkResult.recordset[0].count > 0) {
          //! Folio duplicado, asignar el siguiente disponible
          folio = nextFolio;
          nextFolio++;
          foliosAjustados++;
          warnings.push({
            fila: rowNum,
            columna: "Folio (A)",
            mensaje: `Folio duplicado. Se asignó automáticamente el folio ${folio}`
          });
        }

        //? 3. Validar JOB (Columna B)
        if (!job || job === "") {
          errors.push({
            fila: rowNum,
            columna: "JOB (B)",
            error: "El campo JOB no puede estar vacío"
          });
          continue;
        }

        //? 4. Validar Item (Columna C)
        if (!item || item === "") {
          errors.push({
            fila: rowNum,
            columna: "Item (C)",
            error: "El campo Item no puede estar vacío"
          });
          continue;
        }

        //? 5. Validar Linea (Columna D) - debe ser numérico
        if (!linea && linea !== 0) {
          errors.push({
            fila: rowNum,
            columna: "Linea (D)",
            error: "El campo Linea no puede estar vacío"
          });
          continue;
        }
        const lineaNum = parseInt(linea);
        if (isNaN(lineaNum)) {
          errors.push({
            fila: rowNum,
            columna: "Linea (D)",
            error: `El valor "${linea}" no es un número válido`
          });
          continue;
        }

        //? 6. Validar QtyTot (Columna E) - debe ser numérico positivo
        if (!qtyTot && qtyTot !== 0) {
          errors.push({
            fila: rowNum,
            columna: "QtyTot (E)",
            error: "El campo QtyTot no puede estar vacío"
          });
          continue;
        }
        const qtyTotNum = parseInt(qtyTot);
        if (isNaN(qtyTotNum) || qtyTotNum < 0) {
          errors.push({
            fila: rowNum,
            columna: "QtyTot (E)",
            error: `El valor "${qtyTot}" debe ser un número positivo`
          });
          continue;
        }

        //? 7. Validar QtyReal (Columna F) - debe ser numérico y no mayor a QtyTot
        const qtyRealNum = parseInt(qtyReal) || 0;
        if (isNaN(qtyRealNum) || qtyRealNum < 0) {
          errors.push({
            fila: rowNum,
            columna: "QtyReal (F)",
            error: `El valor "${qtyReal}" debe ser un número positivo o cero`
          });
          continue;
        }
        if (qtyRealNum > qtyTotNum) {
          warnings.push({
            fila: rowNum,
            columna: "QtyReal (F)",
            mensaje: `QtyReal (${qtyRealNum}) es mayor que QtyTot (${qtyTotNum})`
          });
        }

        //? 8. Validar Fecha (Columna G)
        let parsedFecha;
        if (fecha) {
          //* Si es un número de Excel (fecha serial)
          if (typeof fecha === "number") {
            parsedFecha = XLSX.SSF.parse_date_code(fecha);
            parsedFecha = new Date(parsedFecha.y, parsedFecha.m - 1, parsedFecha.d);
          } else {
            parsedFecha = new Date(fecha);
          }
          
          if (isNaN(parsedFecha.getTime())) {
            errors.push({
              fila: rowNum,
              columna: "Fecha (G)",
              error: `El valor "${fecha}" no es una fecha válida. Use formato DD/MM/YYYY`
            });
            continue;
          }
        } else {
          parsedFecha = new Date(); //! Fecha actual si no se proporciona
        }

        //? 9. Validar Estatus (Columna H) - debe ser 0 o 1
        const estatusNum = parseInt(estatus);
        if (isNaN(estatusNum) || (estatusNum !== 0 && estatusNum !== 1)) {
          errors.push({
            fila: rowNum,
            columna: "Estatus (H)",
            error: `El valor "${estatus}" debe ser 0 o 1`
          });
          continue;
        }

        //? ========== INSERTAR EN LA BASE DE DATOS ==========
        await pool.request()
          .input("folio", folio.toString())
          .input("job", job.toString())
          .input("item", item.toString())
          .input("linea", lineaNum)
          .input("qtyTot", qtyTotNum)
          .input("qtyReal", qtyRealNum)
          .input("fecha", parsedFecha)
          .input("estatus", estatusNum)
          .query(`
            INSERT INTO [dbo].[Job] 
            ([Folio], [JOB], [Item], [Linea], [QtyTot], [QtyReal], [Fecha], [Estatus])
            VALUES 
            (@folio, @job, @item, @linea, @qtyTot, @qtyReal, @fecha, @estatus)
          `);

        inserted++;

      } catch (err) {
        console.error(`Error en fila ${rowNum}:`, err);
        errors.push({
          fila: rowNum,
          columna: "General",
          error: err.message
        });
      }
    }

    //* Preparar respuesta
    const hasErrors = errors.length > 0;

    return NextResponse.json({
      ok: !hasErrors, //* Solo es exitoso si no hay errores
      inserted,
      skipped,
      foliosAjustados,
      errors: errors.slice(0, 20), //! Primeros 20 errores
      warnings: warnings.slice(0, 20), //! Primeros 20 advertencias
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      message: hasErrors 
        ? `Se encontraron ${errors.length} errores. Por favor revise los datos.`
        : inserted > 0 
          ? `Se insertaron ${inserted} registros exitosamente${foliosAjustados > 0 ? `. ${foliosAjustados} folios fueron ajustados por duplicados` : ''}`
          : "No se insertaron registros"
    });

  } catch (err) {
    console.error("[jobs/upload-excel][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}