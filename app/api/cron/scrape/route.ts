import { NextRequest, NextResponse } from "next/server";
import { runScrapers } from "@/lib/scrapers/run";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const results = await runScrapers();
  return NextResponse.json({ ok: true, results });
}
