import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MarkInterestingButton } from "./mark-interesting-button";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const tenders = await db.tender.findMany({
    where: {
      opportunity: null,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { entity: { contains: q, mode: "insensitive" } },
              { externalId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ closingDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Portal de licitaciones</h1>
          <p className="text-sm text-slate-500">
            Licitaciones descubiertas automáticamente de PanamaCompra. Marca las que interesan para empezar a darles
            seguimiento.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/portal/nueva">Agregar manualmente</Link>
        </Button>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título, entidad o número de acto…"
          className="h-9 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {tenders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            No hay licitaciones en el portal todavía. Un administrador puede correr el scraper desde{" "}
            <Link href="/admin/scraper" className="underline">
              Admin → Scraper
            </Link>{" "}
            o agregar una manualmente.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tenders.map((tender) => (
            <Card key={tender.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{tender.externalId}</span>
                    <Badge variant="outline">{tender.source === "MANUAL" ? "Manual" : tender.source}</Badge>
                    <Badge variant="secondary">{tender.status}</Badge>
                  </div>
                  <h2 className="font-medium text-slate-900">{tender.title}</h2>
                  <p className="text-sm text-slate-500">{tender.entity}</p>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Monto: {formatCurrency(tender.amount, tender.currency)}</span>
                    <span>Cierre: {formatDate(tender.closingDate)}</span>
                  </div>
                </div>
                <MarkInterestingButton tenderId={tender.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
