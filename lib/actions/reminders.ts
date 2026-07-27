"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";

export async function addReminder(opportunityId: string, title: string, remindAt: string) {
  const user = await requireUser();
  const reminder = await db.reminder.create({
    data: { opportunityId, title, remindAt: new Date(remindAt), createdById: user.id },
  });
  await logActivity(opportunityId, user.id, "RECORDATORIO_CREADO", { titulo: title });
  revalidatePath(`/oportunidades/${opportunityId}`);
  return reminder;
}

export async function toggleReminder(reminderId: string) {
  const user = await requireUser();
  const reminder = await db.reminder.findUniqueOrThrow({ where: { id: reminderId } });
  const updated = await db.reminder.update({ where: { id: reminderId }, data: { done: !reminder.done } });
  void user;
  revalidatePath(`/oportunidades/${reminder.opportunityId}`);
  return updated;
}
