import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

//* GET
//* - sin query "item": devuelve nextItem (tu lógica existente)
//* - con query "item": devuelve el assembly para prellenar el form
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const item = searchParams.get("item");

    const pool = await getPool();

    if (!item) {
      const r = await pool.request().query(`
        SELECT ISNULL(MAX([Item]), 0) + 1 AS nextItem
        FROM [dbo].[Assembly];
      `);
      const nextItem = r.recordset?.[0]?.nextItem ?? null;
      return NextResponse.json({ ok: true, nextItem });
    }

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

//? POST (tu create de siempre)
export async function POST(req) {
  try {
    const { descripcion, customer, nci, customerRev } = await req.json();
    const pool = await getPool();

    //* calcula siguiente item
    const r1 = await pool.request().query(`
      SELECT ISNULL(MAX([Item]), 0) + 1 AS nextItem
      FROM [dbo].[Assembly];
    `);
    const nextItem = r1.recordset?.[0]?.nextItem ?? null;

    //* inserta
    await pool
      .request()
      .input("Item", MSSQL.Int, nextItem)
      .input("Description", MSSQL.NVarChar, descripcion || "")
      .input("Customer", MSSQL.NVarChar, customer || "")
      .input("NCI", MSSQL.NVarChar, nci || "")
      .input("CustomerRev", MSSQL.NVarChar, customerRev || "")
      .input("Adds", MSSQL.NVarChar, "0|0|0|0|0|0|0")
      .query(`
        INSERT INTO [dbo].[Assembly] ([Item],[Description],[Customer],[NCI],[CustomerRev],[Adds])
        VALUES (@Item,@Description,@Customer,@NCI,@CustomerRev,@Adds)
      `);

    return NextResponse.json({ ok: true, item: { Item: nextItem } });
  } catch (err) {
    console.error("[assembly][POST] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo registrar" }, { status: 500 });
  }
}

//? PUT ?item=123  -> actualiza el assembly existente
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
