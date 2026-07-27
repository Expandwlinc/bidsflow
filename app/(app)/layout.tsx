import { auth } from "@/lib/auth";
import { NavBar } from "./nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        userName={session?.user?.name ?? ""}
        userRole={session?.user?.role ?? "VENDEDOR"}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
