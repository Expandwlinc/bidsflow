import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { verifyTotpCode } from "@/lib/totp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
        code: { label: "Código de autenticación", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.totpEnabled) {
          if (!user.totpSecret || !code) return null;
          const validCode = verifyTotpCode(user.totpSecret, user.email, code);
          if (!validCode) return null;
        }

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
