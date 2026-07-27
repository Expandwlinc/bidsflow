import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

const STAGES: { key: string; label: string }[] = [
  { key: "INTERESADO", label: "Interesado" },
  { key: "EN_PREPARACION", label: "En preparación" },
  { key: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { key: "GANADA", label: "Ganada" },
  { key: "PERDIDA", label: "Perdida" },
  { key: "DESCARTADA", label: "Descartada" },
];

const stageBadgeVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  INTERESADO: "outline",
  EN_PREPARACION: "secondary",
  PROPUESTA_ENVIADA: "default",
  GANADA: "success",
  PERDIDA: "destructive",
  DESCARTADA: "destructive",
};

export default async function OportunidadesPage() {
  const opportunities = await db.opportunity.findMany({
    include: { tender: true, assignedTo: true },
    orderBy: { updatedAt: "desc" },
  });

  const grouped = STAGES.map((stage) => ({
    ...stage,
    items: opportunities.filter((o) => o.stage === stage.key),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Oportunidades</h1>
        <p className="text-sm text-slate-500">Pipeline de licitaciones en seguimiento.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {grouped.map((stage) => (
          <div key={stage.key} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stage.label}</h2>
              <span className="text-xs text-slate-400">{stage.items.length}</span>
            </div>
            <div className="space-y-2">
              {stage.items.map((opp) => (
                <Link key={opp.id} href={`/oportunidades/${opp.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="space-y-1.5 py-3">
                      <p className="line-clamp-2 text-sm font-medium text-slate-900">{opp.tender.title}</p>
                      <p className="text-xs text-slate-500">{opp.tender.entity}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={stageBadgeVariant[opp.stage]}>{formatCurrency(opp.tender.amount, opp.tender.currency)}</Badge>
                        <span className="text-[11px] text-slate-400">{formatDate(opp.tender.closingDate)}</span>
                      </div>
                      {opp.assignedTo && <p className="text-[11px] text-slate-400">Asignado: {opp.assignedTo.name}</p>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {stage.items.length === 0 && <p className="px-1 text-xs text-slate-400">Sin oportunidades</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
