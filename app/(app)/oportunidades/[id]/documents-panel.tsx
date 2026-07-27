"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadDocument, deleteDocument } from "@/lib/actions/documents";
import { formatDate } from "@/lib/utils";

type DocItem = {
  id: string;
  name: string;
  type: string;
  sizeBytes: number | null;
  createdAt: Date;
  uploadedBy: { name: string };
};

const TYPES = [
  { value: "PLIEGO", label: "Pliego de cargos" },
  { value: "PROPUESTA", label: "Propuesta" },
  { value: "GARANTIA", label: "Garantía" },
  { value: "ADENDA", label: "Adenda" },
  { value: "OTRO", label: "Otro" },
];

export function DocumentsPanel({ opportunityId, documents }: { opportunityId: string; documents: DocItem[] }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={(formData) => {
          formData.set("opportunityId", opportunityId);
          startTransition(async () => {
            try {
              await uploadDocument(formData);
              toast.success("Documento subido");
              formRef.current?.reset();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Error al subir documento");
            }
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-medium text-slate-600">Archivo</label>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Tipo</label>
          <Select name="type" defaultValue="OTRO">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Subiendo…" : "Subir"}
        </Button>
      </form>

      {documents.length === 0 ? (
        <p className="text-sm text-slate-400">Sin documentos todavía.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <a href={`/api/documents/${doc.id}`} className="text-sm font-medium text-slate-900 underline">
                      {doc.name}
                    </a>
                    <Badge variant="outline">{doc.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    {doc.uploadedBy.name} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteDocument(doc.id);
                    })
                  }
                >
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
