"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOpportunityStage } from "@/lib/actions/opportunities";

const STAGES = [
  { value: "INTERESADO", label: "Interesado" },
  { value: "EN_PREPARACION", label: "En preparación" },
  { value: "PROPUESTA_ENVIADA", label: "Propuesta enviada" },
  { value: "GANADA", label: "Ganada" },
  { value: "PERDIDA", label: "Perdida" },
  { value: "DESCARTADA", label: "Descartada" },
];

export function StageSelect({ opportunityId, stage }: { opportunityId: string; stage: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={stage}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await updateOpportunityStage(opportunityId, value);
            toast.success("Estado actualizado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al actualizar");
          }
        });
      }}
    >
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
