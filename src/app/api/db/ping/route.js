import { NextResponse } from "next/server";
import { getPool } from "@/lib/mssql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        @@SERVERNAME AS server_name,
        DB_NAME() AS db_name,
        SUSER_SNAME() AS login_name,
        @@VERSION AS version
    `);
    return NextResponse.json({ ok: true, result: result.recordset[0] });
  } catch (err) {
    console.error("[db/ping] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
