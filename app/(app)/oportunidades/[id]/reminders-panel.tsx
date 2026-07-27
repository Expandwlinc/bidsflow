"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import { addReminder, toggleReminder } from "@/lib/actions/reminders";

type ReminderItem = { id: string; title: string; remindAt: Date; done: boolean };

export function RemindersPanel({ opportunityId, reminders }: { opportunityId: string; reminders: ReminderItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const add = () => {
    if (!title.trim() || !date) return;
    startTransition(async () => {
      try {
        await addReminder(opportunityId, title.trim(), date);
        setTitle("");
        setDate("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear recordatorio");
      }
    });
  };

  const sorted = [...reminders].sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input placeholder="Título del recordatorio" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="sm" className="w-full" onClick={add} disabled={isPending}>
          Agregar recordatorio
        </Button>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-slate-400">Sin recordatorios.</p>
      ) : (
        <ul className="space-y-1.5">
          {sorted.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={r.done}
                onChange={() =>
                  startTransition(async () => {
                    await toggleReminder(r.id);
                  })
                }
              />
              <span className={cn("flex-1", r.done && "text-slate-400 line-through")}>{r.title}</span>
              <span className="text-xs text-slate-400">{formatDate(r.remindAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
