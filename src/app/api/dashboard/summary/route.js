import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

//* Orden en Adds: 0 Hose, 1 Sleeve/Guard, 2 CrimpA, 3 CollarA, 4 CrimpB, 5 CollarB, 6 Packaging
const MODULES = [
  { key: "hose",     label: "Hose Cut",        idx: 0 },
  { key: "sleeve",   label: "Sleeve/Guard cut",idx: 1 },
  { key: "crimpA",   label: "Crimp A",         idx: 2 },
  { key: "collarA",  label: "Collar A",        idx: 3 },
  { key: "crimpB",   label: "Crimp B",         idx: 4 },
  { key: "collarB",  label: "Collar B",        idx: 5 },
  { key: "packaging",label: "Packaging",       idx: 6 },
];

function splitAdds(addsStr) {
  const parts = String(addsStr || "")
    .split("|")
    .map((p) => (p && /^\d+$/.test(p) ? Number(p) : 0));
  while (parts.length < 7) parts.push(0);
  return parts.slice(0, 7);
}

export async function GET() {
  try {
    const pool = await getPool();

    //? 1) Totales
    const rTotal = await pool.request().query(`
      SELECT COUNT(*) AS total
      FROM [dbo].[Assembly]
    `);
    const total = rTotal.recordset?.[0]?.total ?? 0;

    //? 2) Cobertura por módulo (calcula en memoria)
    const rAdds = await pool.request().query(`
      SELECT [Adds]
      FROM [dbo].[Assembly]
    `);
    const addsRows = rAdds.recordset ?? [];

    const perModule = {};
    MODULES.forEach((m) => (perModule[m.key] = { label: m.label, count: 0, percent: 0 }));

    let withAny = 0;
    let fullyCompleted = 0;
    let sumModulesPerAssembly = 0;

    for (const row of addsRows) {
      const parts = splitAdds(row.Adds);
      const filled = parts.map((n) => Number(n) > 0);
      const countFilled = filled.filter(Boolean).length;

      if (countFilled > 0) withAny++;
      if (countFilled === MODULES.length) fullyCompleted++;
      sumModulesPerAssembly += countFilled;

      MODULES.forEach((m) => {
        if (filled[m.idx]) perModule[m.key].count++;
      });
    }

    Object.values(perModule).forEach((m) => {
      m.percent = total ? Math.round((m.count / total) * 100) : 0;
    });

    //? 3) Top clientes
    const rTopCustomers = await pool.request().query(`
      SELECT TOP 5 LTRIM(RTRIM([Customer])) AS customer, COUNT(*) AS cnt
      FROM [dbo].[Assembly]
      WHERE [Customer] IS NOT NULL AND LTRIM(RTRIM([Customer])) <> ''
      GROUP BY LTRIM(RTRIM([Customer]))
      ORDER BY COUNT(*) DESC
    `);
    const topCustomers = (rTopCustomers.recordset || []).map((r) => ({
      customer: r.customer,
      count: r.cnt,
    }));

    //? 4) Recientes (con JOIN a Usuarios para traer nombre y apellido + AprobadoEn)
    const rRecents = await pool.request().query(`
      SELECT TOP 10
        A.[Item],
        A.[Description],
        A.[Customer],
        A.[NCI],
        A.[CustomerRev],
        A.[Adds],
        A.[Aprobado],
        A.[AprobadoPorId],
        A.[AprobadoEn],
        U.[Nombre]   AS AprobadoPorNombre,
        U.[Apellido] AS AprobadoPorApellido
      FROM [dbo].[Assembly] AS A
      LEFT JOIN [dbo].[Usuarios] AS U
        ON U.[Nomina] = A.[AprobadoPorId]
      ORDER BY A.[Item] DESC
    `);

    const recents = (rRecents.recordset || []).map((r) => {
      const parts = splitAdds(r.Adds);
      const mods = {};
      MODULES.forEach((m) => (mods[m.key] = parts[m.idx] > 0));

      const aprobado      = r.Aprobado ? true : false;
      const aprobadoPorId = r.AprobadoPorId ?? null;

      const nombre   = (r.AprobadoPorNombre || "").toString().trim();
      const apellido = (r.AprobadoPorApellido || "").toString().trim();
      const nombreCompleto = (nombre || apellido) ? `${nombre} ${apellido}`.trim() : null;

      //* mssql devuelve Date JS; la serializamos a ISO 
      const aprobadoEn = r.AprobadoEn instanceof Date
        ? r.AprobadoEn.toISOString()
        : (r.AprobadoEn ?? null);

      return {
        item: r.Item,
        description: r.Description ?? "",
        customer: r.Customer ?? "",
        nci: r.NCI ?? "",
        customerRev: r.CustomerRev ?? "",
        modules: mods,
        aprobado,
        aprobadoPorId,
        aprobadoPor: nombreCompleto ? { nombre, apellido, nombreCompleto } : null,
        aprobadoEn, 
      };
    });

    const avgModulesPerAssembly = total ? +(sumModulesPerAssembly / total).toFixed(2) : 0;

    return NextResponse.json({
      ok: true,
      totals: {
        assemblies: total,
        withAny,
        fullyCompleted,
        avgModulesPerAssembly,
      },
      perModule,
      topCustomers,
      recents,
    });
  } catch (err) {
    console.error("[dashboard/summary][GET] error:", err);
    return NextResponse.json({ ok: false, error: "No se pudo cargar el resumen" }, { status: 500 });
  }
}
