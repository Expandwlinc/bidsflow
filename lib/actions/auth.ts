"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Primer paso del login: valida correo/contraseña sin iniciar sesión todavía,
// para poder mostrar el campo de código de autenticación solo cuando el
// usuario lo tiene activado. La respuesta no distingue "usuario no existe" de
// "contraseña incorrecta" para no filtrar información.
export async function checkCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return { ok: false as const, requiresTotp: false };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false as const, requiresTotp: false };

  return { ok: true as const, requiresTotp: user.totpEnabled };
}
