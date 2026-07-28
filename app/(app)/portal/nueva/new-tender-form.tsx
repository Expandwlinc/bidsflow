"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createManualTender } from "@/lib/actions/opportunities";

export function NewTenderForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createManualTender({
          externalId: String(formData.get("externalId")),
          title: String(formData.get("title")),
          entity: String(formData.get("entity")),
          description: String(formData.get("description") || ""),
          amount: formData.get("amount") ? Number(formData.get("amount")) : undefined,
          closingDate: String(formData.get("closingDate") || "") || undefined,
          url: String(formData.get("url") || "") || undefined,
        });
        toast.success("Licitación agregada al portal");
        router.push("/portal");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="externalId">Número de acto</Label>
            <Input id="externalId" name="externalId" required placeholder="Ej: 2026-0-01-0-XX-LP-000123" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entity">Entidad contratante</Label>
            <Input id="entity" name="entity" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto estimado (USD)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closingDate">Fecha de cierre</Label>
              <Input id="closingDate" name="closingDate" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">Enlace a PanamaCompra</Label>
            <Input id="url" name="url" type="url" placeholder="https://www.panamacompra.gob.pa/…" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Guardando…" : "Guardar licitación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
