"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerScrapeNow } from "@/lib/actions/scraper";

export function TriggerScrapeButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await triggerScrapeNow();
            toast.success("Scraper ejecutado");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al ejecutar el scraper");
          }
        })
      }
    >
      {isPending ? "Actualizando…" : "Actualizar ahora"}
    </Button>
  );
}
