"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";

export async function markAsInteresting(tenderId: string) {
  const user = await requireUser();

  const existing = await db.opportunity.findUnique({ where: { tenderId } });
  if (existing) return existing;

  const opportunity = await db.opportunity.create({
    data: { tenderId, createdById: user.id, assignedToId: user.id },
  });

  await logActivity(opportunity.id, user.id, "OPORTUNIDAD_CREADA", { origen: "portal" });

  revalidatePath("/portal");
  revalidatePath("/oportunidades");
  return opportunity;
}

export async function updateOpportunityStage(opportunityId: string, stage: string) {
  const user = await requireUser();
  const opportunity = await db.opportunity.update({
    where: { id: opportunityId },
    data: { stage: stage as never },
  });

  await logActivity(opportunityId, user.id, "CAMBIO_ESTADO", { nuevoEstado: stage });

  revalidatePath(`/oportunidades/${opportunityId}`);
  revalidatePath("/oportunidades");
  return opportunity;
}

export async function assignOpportunity(opportunityId: string, assignedToId: string | null) {
  const user = await requireUser();
  await db.opportunity.update({ where: { id: opportunityId }, data: { assignedToId } });
  await logActivity(opportunityId, user.id, "REASIGNADA", { assignedToId });
  revalidatePath(`/oportunidades/${opportunityId}`);
  revalidatePath("/oportunidades");
}

export async function createManualTender(input: {
  title: string;
  entity: string;
  externalId: string;
  amount?: number;
  currency?: string;
  description?: string;
  closingDate?: string;
  actDate?: string;
  url?: string;
}) {
  const user = await requireUser();

  const tender = await db.tender.upsert({
    where: { externalId: input.externalId },
    update: {},
    create: {
      externalId: input.externalId,
      source: "MANUAL",
      title: input.title,
      entity: input.entity,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "USD",
      closingDate: input.closingDate ? new Date(input.closingDate) : undefined,
      actDate: input.actDate ? new Date(input.actDate) : undefined,
      url: input.url,
      status: "PUBLICADO",
    },
  });

  if (input.amount) {
    await db.tenderAmountHistory.create({
      data: { tenderId: tender.id, amount: input.amount, currency: input.currency ?? "USD", source: "MANUAL" },
    });
  }

  revalidatePath("/portal");
  void user;
  return { id: tender.id, externalId: tender.externalId };
}
