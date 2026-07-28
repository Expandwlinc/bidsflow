"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { logActivity } from "@/lib/actions/activity";
import { extractTextFromFile } from "@/lib/ai/extract-text";
import { analyzePliego } from "@/lib/ai/pliego-analysis";

export async function runPliegoAnalysis(formData: FormData) {
  const user = await requireUser();
  const opportunityId = formData.get("opportunityId") as string;
  const pastedText = (formData.get("pastedText") as string) || "";
  const file = formData.get("file") as File | null;

  let text = pastedText.trim();
  if (!text && file && file.size > 0) {
    text = await extractTextFromFile(file);
  }

  if (!text) {
    throw new Error("Debes pegar el texto del pliego o subir un archivo (PDF, DOCX o TXT)");
  }

  const { result, rawModel } = await analyzePliego(text);

  const findings = [
    ...result.analisisLegal.hallazgos.map((h) => ({ tipo: "LEGAL", ...h })),
    ...result.analisisTecnico.senalesDireccionamiento.map((h) => ({ tipo: "TECNICO", ...h })),
  ];

  const analysis = await db.aIAnalysis.create({
    data: {
      opportunityId,
      summary: result.resumen,
      riskLevel: result.riesgoGeneral,
      findings: JSON.parse(JSON.stringify(findings)),
      rawModelOutput: JSON.parse(JSON.stringify(result)),
      model: rawModel,
    },
  });

  await logActivity(opportunityId, user.id, "ANALISIS_IA_GENERADO", { riesgo: result.riesgoGeneral });
  revalidatePath(`/oportunidades/${opportunityId}`);
  return analysis;
}

export async function generateTasksFromAnalysis(analysisId: string) {
  const user = await requireUser();
  const analysis = await db.aIAnalysis.findUniqueOrThrow({ where: { id: analysisId } });
  const output = analysis.rawModelOutput as unknown as {
    requisitos: { descripcion: string; categoria: string; obligatorio: boolean }[];
  };

  const requisitos = output.requisitos ?? [];
  if (requisitos.length === 0) return { created: 0 };

  await db.task.createMany({
    data: requisitos.map((r) => ({
      opportunityId: analysis.opportunityId,
      title: r.descripcion,
      description: `Categoría: ${r.categoria}${r.obligatorio ? " · Obligatorio" : " · Opcional"}`,
      isRequirement: true,
      createdFromAi: true,
    })),
  });

  await logActivity(analysis.opportunityId, user.id, "TAREAS_GENERADAS_DESDE_IA", { cantidad: requisitos.length });
  revalidatePath(`/oportunidades/${analysis.opportunityId}`);
  return { created: requisitos.length };
}
