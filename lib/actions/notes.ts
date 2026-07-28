"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";

export async function addNote(opportunityId: string, body: string) {
  const user = await requireUser();
  const note = await db.note.create({ data: { opportunityId, authorId: user.id, body } });
  await logActivity(opportunityId, user.id, "NOTA_AGREGADA");
  revalidatePath(`/oportunidades/${opportunityId}`);
  return note;
}
