import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StageSelect } from "./stage-select";
import { AssigneeSelect } from "./assignee-select";
import { TasksPanel } from "./tasks-panel";
import { DocumentsPanel } from "./documents-panel";
import { NotesPanel } from "./notes-panel";
import { AiAnalysisPanel } from "./ai-analysis-panel";
import { RemindersPanel } from "./reminders-panel";
import { ActivityLog } from "./activity-log";

export default async function OportunidadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const opportunity = await db.opportunity.findUnique({
    where: { id },
    include: {
      tender: { include: { amountHistory: { orderBy: { recordedAt: "desc" } }, changeLogs: { orderBy: { detectedAt: "desc" }, take: 20 } } },
      tasks: { orderBy: { createdAt: "desc" } },
      documents: { include: { uploadedBy: true }, orderBy: { createdAt: "desc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      activity: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 },
      reminders: { orderBy: { remindAt: "asc" } },
      analyses: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!opportunity) notFound();

  const users = await db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const { tender } = opportunity;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">{tender.externalId}</span>
            <Badge variant="outline">{tender.source}</Badge>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{tender.title}</h1>
          <p className="text-sm text-slate-500">{tender.entity}</p>
          {tender.url && (
            <a href={tender.url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline">
              Ver en PanamaCompra
            </a>
          )}
        </div>

        <Tabs defaultValue="resumen">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="tareas">Requisitos y tareas</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="ia">Análisis IA</TabsTrigger>
            <TabsTrigger value="notas">Notas y actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Detalles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Monto actual:</span>{" "}
                    {formatCurrency(tender.amount, tender.currency)}
                  </p>
                  <p>
                    <span className="text-slate-500">Estado en PanamaCompra:</span> {tender.status}
                  </p>
                  <p>
                    <span className="text-slate-500">Método de contratación:</span> {tender.procurementMethod ?? "—"}
                  </p>
                  <p>
                    <span className="text-slate-500">Fecha de cierre:</span> {formatDate(tender.closingDate)}
                  </p>
                  <p>
                    <span className="text-slate-500">Fecha de acto:</span> {formatDate(tender.actDate)}
                  </p>
                  {tender.description && <p className="whitespace-pre-wrap text-slate-700">{tender.description}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial de montos y cambios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Montos</h4>
                    {tender.amountHistory.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin historial de montos.</p>
                    ) : (
                      <ul className="space-y-1">
                        {tender.amountHistory.map((h) => (
                          <li key={h.id} className="flex justify-between text-xs">
                            <span>{formatCurrency(h.amount, h.currency)}</span>
                            <span className="text-slate-400">{formatDate(h.recordedAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-semibold uppercase text-slate-500">Actualizaciones detectadas</h4>
                    {tender.changeLogs.length === 0 ? (
                      <p className="text-xs text-slate-400">Sin cambios detectados por el scraper todavía.</p>
                    ) : (
                      <ul className="space-y-1">
                        {tender.changeLogs.map((c) => (
                          <li key={c.id} className="text-xs">
                            <span className="font-medium">{c.field}</span>: {c.oldValue ?? "—"} → {c.newValue ?? "—"}{" "}
                            <span className="text-slate-400">({formatDate(c.detectedAt)})</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tareas">
            <TasksPanel opportunityId={opportunity.id} tasks={opportunity.tasks} />
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentsPanel opportunityId={opportunity.id} documents={opportunity.documents} />
          </TabsContent>

          <TabsContent value="ia">
            <AiAnalysisPanel opportunityId={opportunity.id} analyses={opportunity.analyses} />
          </TabsContent>

          <TabsContent value="notas">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Notas</h3>
                <NotesPanel opportunityId={opportunity.id} notes={opportunity.notes} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Actividad</h3>
                <ActivityLog activity={opportunity.activity} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StageSelect opportunityId={opportunity.id} stage={opportunity.stage} />
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Asignado a</p>
              <AssigneeSelect opportunityId={opportunity.id} assignedToId={opportunity.assignedToId} users={users} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas y recordatorios</CardTitle>
          </CardHeader>
          <CardContent>
            <RemindersPanel opportunityId={opportunity.id} reminders={opportunity.reminders} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
