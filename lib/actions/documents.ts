"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";
import { storage } from "@/lib/storage";

export async function uploadDocument(formData: FormData) {
  const user = await requireUser();
  const opportunityId = formData.get("opportunityId") as string;
  const type = (formData.get("type") as string) || "OTRO";
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) throw new Error("Archivo requerido");

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await storage.save(file.name, buffer);

  const document = await db.document.create({
    data: {
      opportunityId,
      name: file.name,
      storageKey,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
      type: type as never,
      uploadedById: user.id,
    },
  });

  await logActivity(opportunityId, user.id, "DOCUMENTO_SUBIDO", { nombre: file.name, tipo: type });
  revalidatePath(`/oportunidades/${opportunityId}`);
  return document;
}

export async function deleteDocument(documentId: string) {
  const user = await requireUser();
  const document = await db.document.delete({ where: { id: documentId } });
  await storage.remove(document.storageKey);
  await logActivity(document.opportunityId, user.id, "DOCUMENTO_ELIMINADO", { nombre: document.name });
  revalidatePath(`/oportunidades/${document.opportunityId}`);
}
