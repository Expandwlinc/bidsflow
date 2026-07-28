"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateTotpSecret, verifyTotpCode, buildEnrollment } from "@/lib/totp";

export async function beginTotpEnrollment() {
  const sessionUser = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  const secret = generateTotpSecret();
  const { qrDataUrl } = await buildEnrollment(secret, user.email);

  return { secret, qrDataUrl };
}

export async function confirmTotpEnrollment(secret: string, code: string) {
  const sessionUser = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  const valid = verifyTotpCode(secret, user.email, code);
  if (!valid) {
    throw new Error("Código inválido. Verifica la hora de tu dispositivo e intenta de nuevo.");
  }

  await db.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: true } });
  revalidatePath("/cuenta");
}

export async function disableTotp(code: string) {
  const sessionUser = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  if (!user.totpEnabled || !user.totpSecret) {
    throw new Error("La autenticación en dos pasos no está activa.");
  }

  const valid = verifyTotpCode(user.totpSecret, user.email, code);
  if (!valid) {
    throw new Error("Código inválido.");
  }

  await db.user.update({ where: { id: user.id }, data: { totpSecret: null, totpEnabled: false } });
  revalidatePath("/cuenta");
}
