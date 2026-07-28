"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function createUser(input: { name: string; email: string; password: string; role: "ADMIN" | "VENDEDOR" }) {
  await requireAdmin();
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await db.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
  });
  revalidatePath("/admin/usuarios");
  return { id: user.id, email: user.email };
}

export async function updateUserRole(userId: string, role: "ADMIN" | "VENDEDOR") {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/usuarios");
}
