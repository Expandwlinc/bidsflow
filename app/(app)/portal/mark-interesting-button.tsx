"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAsInteresting } from "@/lib/actions/opportunities";

export function MarkInterestingButton({ tenderId }: { tenderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            const opportunity = await markAsInteresting(tenderId);
            toast.success("Marcada como interesante");
            router.push(`/oportunidades/${opportunity.id}`);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al marcar como interesante");
          }
        });
      }}
    >
      {isPending ? "Guardando…" : "Marcar interesante"}
    </Button>
  );
}
