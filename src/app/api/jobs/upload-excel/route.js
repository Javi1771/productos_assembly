import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

//? --- Normalizador: sin acentos, minúsculas, sin espacios/guiones/underscores ---
const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") //! quita diacríticos
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_./\\]/g, "");

//? --- Sinónimos permitidos por columna requerida ---
const HEADER_SYNONYMS = {
  folio:   ["folio", "nofolio", "numfolio", "idfolio"],
  job:     ["job", "orden", "ordenjob", "ordenproduccion"],
  item:    ["item", "articulo", "producto", "codigo", "codigoitem", "sku", "itemm", "item1", "ítem"],
  linea:   ["linea", "línea", "line", "lineas"],
  qtyTot:  ["qtytot", "cantidadtotal", "canttotal", "qtytotal", "total", "tot"],
  qtyReal: ["qtyreal", "cantidadreal", "cantreal", "real", "hecho", "producido"],
  fecha:   ["fecha", "date", "fecharegistro", "fechaprogramada"],
  estatus: ["estatus", "estado", "status"],
};

//* Devuelve índice por columna requerida según encabezados reales
function buildHeaderIndex(headersRow) {
  const idx = {
    folio: null,
    job: null,
    item: null,
    linea: null,
    qtyTot: null,
    qtyReal: null,
    fecha: null,
    estatus: null,
  };

  const normalizedHeaders = headersRow.map((h) => normalize(h));

  Object.keys(HEADER_SYNONYMS).forEach((key) => {
    const syns = HEADER_SYNONYMS[key].map(normalize);
    for (let i = 0; i < normalizedHeaders.length; i++) {
      if (syns.includes(normalizedHeaders[i]) && idx[key] === null) {
        idx[key] = i;
        break;
      }
    }
  });

  return idx;
}

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

    //* Leer Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    //* A JSON por filas (fila 0 = encabezados)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length < 2) {
      return NextResponse.json(
        { ok: false, error: "El archivo está vacío o no tiene datos" },
        { status: 400 }
      );
    }

    //* Mapear encabezados flexible
    const headersRow = jsonData[0] || [];
    const headerIndex = buildHeaderIndex(headersRow);

    //* Verificar faltantes
    const pretty = {
      folio: "Folio",
      job: "JOB",
      item: "Item",
      linea: "Linea",
      qtyTot: "QtyTot",
      qtyReal: "QtyReal",
      fecha: "Fecha",
      estatus: "Estatus",
    };
    const missing = Object.keys(headerIndex).filter((k) => headerIndex[k] === null);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan columnas requeridas en los encabezados.",
          detalles: missing.map((m) => `Falta columna: "${pretty[m]}"`),
          encabezadosDetectados: headersRow,
        },
        { status: 400 }
      );
    }

    //* Conexión BD y siguiente folio disponible
    const pool = await getPool();
    const lastFolioResult = await pool
      .request()
      .query(
        "SELECT MAX(CAST([Folio] AS INT)) as lastFolio FROM [dbo].[Job] WHERE ISNUMERIC([Folio]) = 1"
      );
    let nextFolio = (lastFolioResult.recordset[0].lastFolio || 0) + 1;

    //* Procesar filas
    const dataRows = jsonData.slice(1);

    let inserted = 0;
    let skipped = 0;
    let foliosAjustados = 0;
    const errors = [];
    const warnings = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; //* +2 por encabezado

      //* Saltar filas totalmente vacías
      if (
        !row ||
        row.length === 0 ||
        row.every((cell) => cell === undefined || cell === null || String(cell).trim() === "")
      ) {
        skipped++;
        continue;
      }

      try {
        //* Obtener por índice mapeado
        const getVal = (key) => row[headerIndex[key]];

        let folio = getVal("folio");
        const job = getVal("job");
        const item = getVal("item");
        const linea = getVal("linea");
        const qtyTot = getVal("qtyTot");
        const qtyReal = getVal("qtyReal");
        const fecha = getVal("fecha");
        const estatus = getVal("estatus");

        //? ===== VALIDACIONES =====

        //? 1) Folio obligatorio
        if (folio === undefined || String(folio).trim() === "") {
          errors.push({
            fila: rowNum,
            columna: "Folio",
            error: "El Folio es obligatorio y no puede estar vacío",
          });
          continue;
        }

        //? 2) Folio duplicado → autoajustar
        const checkResult = await pool
          .request()
          .input("folio", String(folio))
          .query("SELECT COUNT(*) as count FROM [dbo].[Job] WHERE [Folio] = @folio");

        if (checkResult.recordset[0].count > 0) {
          folio = nextFolio;
          nextFolio++;
          foliosAjustados++;
          warnings.push({
            fila: rowNum,
            columna: "Folio",
            mensaje: `Folio duplicado. Se asignó automáticamente el folio ${folio}`,
          });
        }

        //? 3) JOB obligatorio
        if (job === undefined || String(job).trim() === "") {
          errors.push({
            fila: rowNum,
            columna: "JOB",
            error: "El campo JOB no puede estar vacío",
          });
          continue;
        }

        //? 4) Item obligatorio
        if (item === undefined || String(item).trim() === "") {
          errors.push({
            fila: rowNum,
            columna: "Item",
            error: "El campo Item no puede estar vacío",
          });
          continue;
        }

        // 5) Linea numérica
        if (linea === undefined || String(linea).trim() === "") {
          errors.push({
            fila: rowNum,
            columna: "Linea",
            error: "El campo Linea no puede estar vacío",
          });
          continue;
        }
        const lineaNum = parseInt(linea);
        if (isNaN(lineaNum)) {
          errors.push({
            fila: rowNum,
            columna: "Linea",
            error: `El valor "${linea}" no es un número válido`,
          });
          continue;
        }

        //? 6) QtyTot numérico positivo
        if (qtyTot === undefined || String(qtyTot).trim() === "") {
          errors.push({
            fila: rowNum,
            columna: "QtyTot",
            error: "El campo QtyTot no puede estar vacío",
          });
          continue;
        }
        const qtyTotNum = parseInt(qtyTot);
        if (isNaN(qtyTotNum) || qtyTotNum < 0) {
          errors.push({
            fila: rowNum,
            columna: "QtyTot",
            error: `El valor "${qtyTot}" debe ser un número positivo`,
          });
          continue;
        }

        //? 7) QtyReal numérico y no mayor a QtyTot (se permite 0)
        const qtyRealNum = parseInt(qtyReal) || 0;
        if (isNaN(qtyRealNum) || qtyRealNum < 0) {
          errors.push({
            fila: rowNum,
            columna: "QtyReal",
            error: `El valor "${qtyReal}" debe ser un número positivo o cero`,
          });
          continue;
        }
        if (qtyRealNum > qtyTotNum) {
          warnings.push({
            fila: rowNum,
            columna: "QtyReal",
            mensaje: `QtyReal (${qtyRealNum}) es mayor que QtyTot (${qtyTotNum})`,
          });
        }

        //? 8) Fecha (serial Excel o string/Date). Si no hay, usa hoy.
        let parsedFecha;
        if (fecha !== undefined && String(fecha).trim() !== "") {
          if (typeof fecha === "number") {
            const d = XLSX.SSF.parse_date_code(fecha);
            parsedFecha = new Date(d.y, d.m - 1, d.d);
          } else {
            parsedFecha = new Date(fecha);
          }
          if (isNaN(parsedFecha.getTime())) {
            errors.push({
              fila: rowNum,
              columna: "Fecha",
              error: `El valor "${fecha}" no es una fecha válida. Use formato DD/MM/YYYY`,
            });
            continue;
          }
        } else {
          parsedFecha = new Date();
        }

        //? 9) Estatus 0 o 1
        const estatusNum = parseInt(estatus);
        if (isNaN(estatusNum) || (estatusNum !== 0 && estatusNum !== 1)) {
          errors.push({
            fila: rowNum,
            columna: "Estatus",
            error: `El valor "${estatus}" debe ser 0 o 1`,
          });
          continue;
        }

        //? ===== INSERT =====
        await pool
          .request()
          .input("folio", String(folio))
          .input("job", String(job))
          .input("item", String(item))
          .input("linea", parseInt(linea))
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
          error: err.message || "Error desconocido",
        });
      }
    }

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
        ? `Se insertaron ${inserted} registros exitosamente${
            foliosAjustados > 0 ? `. ${foliosAjustados} folios fueron ajustados por duplicados` : ""
          }`
        : "No se insertaron registros",
    });
  } catch (err) {
    console.error("[jobs/upload-excel][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
