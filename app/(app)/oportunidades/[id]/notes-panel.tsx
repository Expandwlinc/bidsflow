"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { addNote } from "@/lib/actions/notes";
import { formatDate } from "@/lib/utils";

type NoteItem = { id: string; body: string; createdAt: Date; author: { name: string } };

export function NotesPanel({ opportunityId, notes }: { opportunityId: string; notes: NoteItem[] }) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        await addNote(opportunityId, body.trim());
        setBody("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar nota");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Escribe una nota para el equipo…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <Button onClick={submit} disabled={isPending} size="sm">
          Agregar nota
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-slate-400">Sin notas todavía.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="space-y-1 py-3">
                <p className="whitespace-pre-wrap text-sm text-slate-800">{note.body}</p>
                <p className="text-xs text-slate-400">
                  {note.author.name} · {formatDate(note.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
