"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { runPliegoAnalysis, generateTasksFromAnalysis } from "@/lib/actions/ai";
import { cn, formatDate } from "@/lib/utils";

type Finding = { tipo: string; severidad: "BAJA" | "MEDIA" | "ALTA"; [key: string]: unknown };

type AnalysisItem = {
  id: string;
  summary: string;
  riskLevel: string;
  findings: unknown;
  createdAt: Date;
  rawModelOutput: unknown;
};

const riskVariant: Record<string, "success" | "warning" | "destructive"> = {
  BAJA: "success",
  MEDIA: "warning",
  ALTA: "destructive",
};

export function AiAnalysisPanel({ opportunityId, analyses }: { opportunityId: string; analyses: AnalysisItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [pastedText, setPastedText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const runAnalysis = () => {
    startTransition(async () => {
      const formData = new FormData(formRef.current!);
      formData.set("opportunityId", opportunityId);
      formData.set("pastedText", pastedText);
      try {
        await runPliegoAnalysis(formData);
        toast.success("Análisis generado");
        setPastedText("");
        formRef.current?.reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al generar el análisis");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Analizar pliego de cargos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Pega el texto del pliego, o sube un archivo (PDF, DOCX o TXT). Claude generará un resumen, un checklist de
            requisitos, un análisis legal de cláusulas riesgosas y un análisis técnico buscando posibles señales de
            direccionamiento.
          </p>
          <form ref={formRef} className="space-y-3">
            <Textarea
              placeholder="Pega aquí el texto del pliego de cargos…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={5}
            />
            <div className="flex items-center gap-3">
              <input type="file" name="file" accept=".pdf,.docx,.txt" className="text-sm" />
              <Button type="button" onClick={runAnalysis} disabled={isPending}>
                {isPending ? "Analizando… (puede tardar un minuto)" : "Analizar con IA"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <p className="text-sm text-slate-400">Aún no se ha generado ningún análisis.</p>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <AnalysisResult key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnalysisResult({ analysis }: { analysis: AnalysisItem }) {
  const [isPending, startTransition] = useTransition();
  const output = analysis.rawModelOutput as {
    requisitos?: { descripcion: string; categoria: string; obligatorio: boolean }[];
    fechasClave?: { tipo: string; fecha: string; detalle: string }[];
    montoEstimado?: number | null;
  };
  const findings = (analysis.findings as Finding[]) ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Análisis del {formatDate(analysis.createdAt)}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">{analysis.summary}</p>
        </div>
        <Badge variant={riskVariant[analysis.riskLevel] ?? "outline"}>Riesgo general: {analysis.riskLevel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {findings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-500">Hallazgos</h4>
            {findings.map((f, i) => (
              <div key={i} className="rounded-md border border-slate-200 p-2 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">{f.tipo === "LEGAL" ? "Legal" : "Técnico / direccionamiento"}</Badge>
                  <Badge variant={riskVariant[f.severidad] ?? "outline"}>{f.severidad}</Badge>
                </div>
                <p className="text-slate-700">
                  {String(f.clausula ?? f.hallazgo ?? "")}: {String(f.riesgo ?? f.justificacion ?? "")}
                </p>
              </div>
            ))}
          </div>
        )}

        {output.requisitos && output.requisitos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-slate-500">
                Requisitos detectados ({output.requisitos.length})
              </h4>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await generateTasksFromAnalysis(analysis.id);
                    toast.success(`${res.created} tareas creadas`);
                  })
                }
              >
                Generar tareas
              </Button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {output.requisitos.map((r, i) => (
                <li key={i} className={cn(r.obligatorio && "font-medium")}>
                  {r.descripcion} <span className="text-xs text-slate-400">({r.categoria})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
