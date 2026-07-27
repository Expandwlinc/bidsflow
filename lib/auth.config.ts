import type { NextAuthConfig } from "next-auth";

// Configuración "edge-safe": no importa Prisma ni bcrypt, para poder usarse
// en el middleware (que corre en un runtime restringido). El provider de
// credenciales (que sí necesita la base de datos) se agrega únicamente en
// lib/auth.ts, usado por las rutas y server actions.
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: "ADMIN" | "VENDEDOR" }).role;
        token.id = user.id as string;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "VENDEDOR";
      }
      return session;
    },
  },
};
