import { NextResponse } from "next/server";
import { getPool, MSSQL } from "@/lib/mssql";

export const runtime = "nodejs";

//* Normaliza Adds a 5 segmentos mínimo
function normalizeAdds(adds) {
  const parts = (adds ?? "").split("|");
  while (parts.length < 5) parts.push("0");
  return parts;
}

//** GET /api/hose?assemblyItem=123  (o)  /api/hose?item=788828 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const assemblyItem = Number(searchParams.get("assemblyItem"));
    const item = Number(searchParams.get("item"));

    const pool = await getPool();

    let hoseItem = Number.isFinite(item) ? item : null;

    //! Si no dieron ?item, buscar el que está en Adds[0] del Assembly
    if (!hoseItem && Number.isFinite(assemblyItem)) {
      const rAsm = await pool
        .request()
        .input("asmItem", MSSQL.Int, assemblyItem)
        .query(`SELECT [Adds] FROM [dbo].[Assembly] WHERE [Item]=@asmItem`);
      if (rAsm.recordset.length) {
        const parts = normalizeAdds(rAsm.recordset[0].Adds);
        const first = Number(parts[0]);
        if (Number.isFinite(first) && first > 0) hoseItem = first;
      }
    }

    if (!hoseItem) return NextResponse.json({ ok: true, hose: null });

    const rH = await pool
      .request()
      .input("item", MSSQL.Int, hoseItem)
      .query(`
        SELECT TOP 1 [Folio],[Item],[Description],[Min],[Nom],[Max],[Clea]
        FROM [dbo].[Hose]
        WHERE [Item]=@item
        ORDER BY [Folio] DESC
      `);

    return NextResponse.json({ ok: true, hose: rH.recordset[0] ?? null });
  } catch (err) {
    console.error("[hose][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo obtener Hose" },
      { status: 500 }
    );
  }
}

//** POST /api/hose  -> upsert con preferencia a editar lo que ya está ligado en Adds[0] */
export async function POST(req) {
  try {
    const body = await req.json();
    const assemblyItem = Number(body.assemblyItem);
    const item = Number(body.item); //* nuevo/actual Item de Hose
    const desc = String(body.description ?? "");
    const min = body.min == null || body.min === "" ? null : Number(body.min);
    const max = body.max == null || body.max === "" ? null : Number(body.max);
    const nom = body.nom == null || body.nom === "" ? null : Number(body.nom);
    const clea = body.clea == null || body.clea === "" ? null : String(body.clea);

    if (!Number.isFinite(assemblyItem)) {
      return NextResponse.json({ ok: false, error: "Assembly inválido" }, { status: 400 });
    }
    if (!Number.isFinite(item)) {
      return NextResponse.json({ ok: false, error: "Item de Hose inválido" }, { status: 400 });
    }

    const pool = await getPool();
    const tx = new MSSQL.Transaction(pool);
    await tx.begin();

    try {
      const rtx = new MSSQL.Request(tx);

      //! Bloquear la fila del assembly para leer/modificar Adds de forma segura
      const rAsm = await rtx
        .input("asmItem", MSSQL.Int, assemblyItem)
        .query(`
          SELECT [Adds]
          FROM [dbo].[Assembly] WITH (UPDLOCK, ROWLOCK)
          WHERE [Item]=@asmItem
        `);

      if (rAsm.recordset.length === 0) {
        throw new Error(`Assembly ${assemblyItem} no existe`);
      }

      const addsParts = normalizeAdds(rAsm.recordset[0].Adds);
      const oldHoseItem = Number(addsParts[0]) || null;

      let mode = "inserted";
      let folio = null;

      if (Number.isFinite(oldHoseItem) && oldHoseItem > 0) {
        //* EDITAR el hose ya vinculado en Adds[0]
        const upd = await rtx
          .input("oldItem", MSSQL.Int, oldHoseItem)
          .input("newItem", MSSQL.Int, item)
          .input("desc", MSSQL.NVarChar(255), desc)
          .input("min", MSSQL.Float, min)
          .input("nom", MSSQL.Float, nom)
          .input("max", MSSQL.Float, max)
          .input("clea", MSSQL.NVarChar(255), clea)
          .query(`
            UPDATE H
            SET [Item]=@newItem,
                [Description]=@desc,
                [Min]=@min,
                [Nom]=@nom,
                [Max]=@max,
                [Clea]=@clea
            OUTPUT INSERTED.[Folio]
            FROM [dbo].[Hose] H
            WHERE H.[Item]=@oldItem
          `);

        if (upd.rowsAffected[0] > 0) {
          mode = "updated";
          folio = upd.recordset[0]?.Folio ?? null;
        } else {
          //! Si no existía por oldItem (caso raro), intentar por newItem...
          const hasNew = await rtx
            .input("newItem2", MSSQL.Int, item)
            .query(`SELECT TOP 1 [Folio] FROM [dbo].[Hose] WHERE [Item]=@newItem2 ORDER BY [Folio] DESC`);

          if (hasNew.recordset.length) {
            await rtx
              .input("desc2", MSSQL.NVarChar(255), desc)
              .input("min2", MSSQL.Float, min)
              .input("nom2", MSSQL.Float, nom)
              .input("max2", MSSQL.Float, max)
              .input("clea2", MSSQL.NVarChar(255), clea)
              .input("folio2", MSSQL.Int, hasNew.recordset[0].Folio)
              .query(`
                UPDATE [dbo].[Hose]
                SET [Description]=@desc2,[Min]=@min2,[Nom]=@nom2,[Max]=@max2,[Clea]=@clea2
                WHERE [Folio]=@folio2
              `);
            mode = "updated";
            folio = hasNew.recordset[0].Folio;
          } else {
            //! ...y si tampoco, insertamos
            const next = await rtx.query(`SELECT ISNULL(MAX([Folio]),0)+1 AS next FROM [dbo].[Hose]`);
            const nextFolio = next.recordset[0].next;

            await rtx
              .input("folio", MSSQL.Int, nextFolio)
              .input("newItem3", MSSQL.Int, item)
              .input("desc3", MSSQL.NVarChar(255), desc)
              .input("min3", MSSQL.Float, min)
              .input("nom3", MSSQL.Float, nom)
              .input("max3", MSSQL.Float, max)
              .input("clea3", MSSQL.NVarChar(255), clea)
              .query(`
                INSERT INTO [dbo].[Hose]([Folio],[Item],[Description],[Min],[Nom],[Max],[Clea])
                VALUES(@folio,@newItem3,@desc3,@min3,@nom3,@max3,@clea3)
              `);
            folio = nextFolio;
            mode = "inserted";
          }
        }
      } else {
        //* Assembly no tenía Hose previo: upsert por item enviado
        const has = await rtx
          .input("it", MSSQL.Int, item)
          .query(`SELECT TOP 1 [Folio] FROM [dbo].[Hose] WHERE [Item]=@it ORDER BY [Folio] DESC`);

        if (has.recordset.length) {
          await rtx
            .input("desc", MSSQL.NVarChar(255), desc)
            .input("min", MSSQL.Float, min)
            .input("nom", MSSQL.Float, nom)
            .input("max", MSSQL.Float, max)
            .input("clea", MSSQL.NVarChar(255), clea)
            .input("folio", MSSQL.Int, has.recordset[0].Folio)
            .query(`
              UPDATE [dbo].[Hose]
              SET [Description]=@desc,[Min]=@min,[Nom]=@nom,[Max]=@max,[Clea]=@clea
              WHERE [Folio]=@folio
            `);
          folio = has.recordset[0].Folio;
          mode = "updated";
        } else {
          const next = await rtx.query(`SELECT ISNULL(MAX([Folio]),0)+1 AS next FROM [dbo].[Hose]`);
          const nextFolio = next.recordset[0].next;

          await rtx
            .input("folio", MSSQL.Int, nextFolio)
            .input("newItem", MSSQL.Int, item)
            .input("desc", MSSQL.NVarChar(255), desc)
            .input("min", MSSQL.Float, min)
            .input("nom", MSSQL.Float, nom)
            .input("max", MSSQL.Float, max)
            .input("clea", MSSQL.NVarChar(255), clea)
            .query(`
              INSERT INTO [dbo].[Hose]([Folio],[Item],[Description],[Min],[Nom],[Max],[Clea])
              VALUES(@folio,@newItem,@desc,@min,@nom,@max,@clea)
            `);
          folio = nextFolio;
          mode = "inserted";
        }
      }

      //* Actualiza Adds[0] del Assembly al item enviado
      addsParts[0] = String(item);
      const newAdds = addsParts.join("|");

      await rtx
        .input("adds", MSSQL.NVarChar(500), newAdds)
        .input("asmItem2", MSSQL.Int, assemblyItem)
        .query(`UPDATE [dbo].[Assembly] SET [Adds]=@adds WHERE [Item]=@asmItem2`);

      await tx.commit();

      return NextResponse.json({
        ok: true,
        mode,
        hose: { folio, item, description: desc, min, nom, max, clea },
        assembly: { item: assemblyItem, adds: newAdds },
      });
    } catch (errTx) {
      await tx.rollback();
      throw errTx;
    }
  } catch (err) {
    console.error("[hose][POST] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar Hose" },
      { status: 500 }
    );
  }
}
