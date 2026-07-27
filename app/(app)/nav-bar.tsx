"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/portal", label: "Portal" },
  { href: "/oportunidades", label: "Oportunidades" },
];

const adminLinks = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/scraper", label: "Scraper" },
];

export function NavBar({ userName, userRole }: { userName: string; userRole: "ADMIN" | "VENDEDOR" }) {
  const pathname = usePathname();
  const items = userRole === "ADMIN" ? [...links, ...adminLinks] : links;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="text-base font-semibold text-slate-900">
            BidsFlow
          </Link>
          <nav className="flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  pathname.startsWith(item.href) && "bg-slate-100 text-slate-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {userName} <span className="text-xs text-slate-400">({userRole === "ADMIN" ? "admin" : "vendedor"})</span>
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
