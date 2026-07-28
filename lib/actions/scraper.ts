"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { runScrapers } from "@/lib/scrapers/run";

export async function triggerScrapeNow() {
  await requireAdmin();
  const results = await runScrapers();
  revalidatePath("/admin/scraper");
  revalidatePath("/portal");
  return results;
}
