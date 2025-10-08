import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

//* GET
//* - sin query "item": (ya no devuelve nextItem)
//* - con query "item": devuelve el assembly para prellenar el form
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const item = searchParams.get("item");

    if (!item) {
      //* Cambiamos el comportamiento: sin item ya no calculamos nextItem
      return NextResponse.json(
        { ok: false, error: "Parámetro 'item' requerido" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    //? --- GET específico por item ---
    const r2 = await pool
      .request()
      .input("item", MSSQL.Int, Number(item))
      .query(`
        SELECT [Item],[Description],[Customer],[NCI],[CustomerRev],[Adds]
        FROM [dbo].[Assembly]
        WHERE [Item] = @item
      `);

    const assembly = r2.recordset?.[0];
    if (!assembly) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, assembly });
  } catch (err) {
    console.error("[assembly][GET] error:", err);
    return NextResponse.json({ ok: false, error: "Error al obtener Assembly" }, { status: 500 });
  }
}

//? POST -> crear con Item proporcionado por el cliente
export async function POST(req) {
  try {
    const { item, descripcion, customer, nci, customerRev } = await req.json();

    //* Validaciones
    const parsed = Number(item);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json(
        { ok: false, error: "Item inválido. Debe ser un entero positivo." },
        { status: 400 }
      );
    }

    const pool = await getPool();

    //! Validar duplicado
    const exists = await pool
      .request()
      .input("Item", MSSQL.Int, parsed)
      .query(`SELECT 1 FROM [dbo].[Assembly] WHERE [Item]=@Item`);
    if (exists.recordset.length > 0) {
      return NextResponse.json(
        { ok: false, error: `El Item ${parsed} ya existe.` },
        { status: 409 }
      );
    }

    //* Insertar
    await pool
      .request()
      .input("Item", MSSQL.Int, parsed)
      .input("Description", MSSQL.NVarChar, descripcion || "")
      .input("Customer", MSSQL.NVarChar, customer || "")
      .input("NCI", MSSQL.NVarChar, nci || "")
      .input("CustomerRev", MSSQL.NVarChar, customerRev || "")
      .input("Adds", MSSQL.NVarChar, "0|0|0|0|0|0|0")
      .query(`
        INSERT INTO [dbo].[Assembly] ([Item],[Description],[Customer],[NCI],[CustomerRev],[Adds])
        VALUES (@Item,@Description,@Customer,@NCI,@CustomerRev,@Adds)
      `);

    return NextResponse.json({ ok: true, item: { Item: parsed } });
  } catch (err) {
    console.error("[assembly][POST] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo registrar" }, { status: 500 });
  }
}

//? PUT ?item=123  -> actualiza el assembly existente (no cambia el Item)
export async function PUT(req) {
  try {
    const { searchParams } = new URL(req.url);
    const item = Number(searchParams.get("item"));
    if (!item) {
      return NextResponse.json({ ok: false, error: "item requerido" }, { status: 400 });
    }

    const { descripcion, customer, nci, customerRev } = await req.json();
    const pool = await getPool();

    const r0 = await pool
      .request()
      .input("Item", MSSQL.Int, item)
      .query(`SELECT 1 FROM [dbo].[Assembly] WHERE [Item]=@Item`);
    if (r0.recordset.length === 0) {
      return NextResponse.json({ ok: false, error: "No encontrado" }, { status: 404 });
    }

    await pool
      .request()
      .input("Item", MSSQL.Int, item)
      .input("Description", MSSQL.NVarChar, descripcion || "")
      .input("Customer", MSSQL.NVarChar, customer || "")
      .input("NCI", MSSQL.NVarChar, nci || "")
      .input("CustomerRev", MSSQL.NVarChar, customerRev || "")
      .query(`
        UPDATE [dbo].[Assembly]
        SET [Description]=@Description,
            [Customer]=@Customer,
            [NCI]=@NCI,
            [CustomerRev]=@CustomerRev
        WHERE [Item]=@Item
      `);

    return NextResponse.json({ ok: true, item: { Item: item } });
  } catch (err) {
    console.error("[assembly][PUT] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });
  }
}
