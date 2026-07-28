import "server-only";
import { db } from "@/lib/db";
import { OcdsBulkConnector } from "./ocds-bulk-connector";
import { PortalLiveConnector } from "./portal-live-connector";
import type { ScraperConnector, TenderCandidate } from "./types";

const CONNECTORS: ScraperConnector[] = [new OcdsBulkConnector(), new PortalLiveConnector()];

const TRACKED_FIELDS = ["status", "closingDate", "actDate", "title", "amount"] as const;

export async function runScrapers() {
  const results = [];
  for (const connector of CONNECTORS) {
    results.push(await runConnector(connector));
  }
  return results;
}

async function runConnector(connector: ScraperConnector) {
  const run = await db.scrapeRun.create({ data: { source: connector.source, status: "RUNNING" } });

  let newCount = 0;
  let updatedCount = 0;

  try {
    const candidates = await connector.fetchCandidates();

    for (const candidate of candidates) {
      const { isNew, isUpdated } = await upsertTender(candidate, connector.source);
      if (isNew) newCount++;
      if (isUpdated) updatedCount++;
    }

    await db.scrapeRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", finishedAt: new Date(), newCount, updatedCount },
    });
  } catch (err) {
    await db.scrapeRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        newCount,
        updatedCount,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
  }

  return db.scrapeRun.findUnique({ where: { id: run.id } });
}

async function upsertTender(candidate: TenderCandidate, source: ScraperConnector["source"]) {
  const existing = await db.tender.findUnique({ where: { externalId: candidate.externalId } });

  if (!existing) {
    const created = await db.tender.create({
      data: {
        externalId: candidate.externalId,
        source,
        title: candidate.title,
        entity: candidate.entity,
        description: candidate.description,
        amount: candidate.amount,
        currency: candidate.currency ?? "USD",
        status: candidate.status ?? "DESCONOCIDO",
        category: candidate.category,
        procurementMethod: candidate.procurementMethod,
        publishDate: candidate.publishDate,
        closingDate: candidate.closingDate,
        actDate: candidate.actDate,
        url: candidate.url,
        pliegoDocumentUrl: candidate.pliegoDocumentUrl,
        rawData: candidate.raw ? JSON.parse(JSON.stringify(candidate.raw)) : undefined,
        lastScrapedAt: new Date(),
      },
    });

    if (candidate.amount) {
      await db.tenderAmountHistory.create({
        data: { tenderId: created.id, amount: candidate.amount, currency: candidate.currency ?? "USD", source },
      });
    }

    return { isNew: true, isUpdated: false };
  }

  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
  const updateData: Record<string, unknown> = { lastScrapedAt: new Date() };

  const candidateValues: Record<(typeof TRACKED_FIELDS)[number], unknown> = {
    status: candidate.status,
    closingDate: candidate.closingDate,
    actDate: candidate.actDate,
    title: candidate.title,
    amount: candidate.amount,
  };

  for (const field of TRACKED_FIELDS) {
    const newValue = candidateValues[field];
    if (newValue === undefined) continue;
    const oldValue = existing[field as keyof typeof existing];
    const oldStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue ?? "");
    const newStr = newValue instanceof Date ? newValue.toISOString() : String(newValue ?? "");
    if (oldStr !== newStr) {
      changes.push({ field, oldValue: oldStr || null, newValue: newStr || null });
      updateData[field] = newValue;
    }
  }

  if (changes.length === 0) {
    await db.tender.update({ where: { id: existing.id }, data: { lastScrapedAt: new Date() } });
    return { isNew: false, isUpdated: false };
  }

  await db.tender.update({ where: { id: existing.id }, data: updateData });

  await db.tenderChangeLog.createMany({
    data: changes.map((c) => ({ tenderId: existing.id, field: c.field, oldValue: c.oldValue, newValue: c.newValue })),
  });

  if (candidate.amount && Number(existing.amount) !== candidate.amount) {
    await db.tenderAmountHistory.create({
      data: { tenderId: existing.id, amount: candidate.amount, currency: candidate.currency ?? "USD", source },
    });
  }

  return { isNew: false, isUpdated: true };
}
