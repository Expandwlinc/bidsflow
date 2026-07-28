"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createTask, updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { cn, formatDate } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  isRequirement: boolean;
  createdFromAi: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "Por hacer",
  IN_PROGRESS: "En progreso",
  DONE: "Hecho",
  BLOCKED: "Bloqueado",
};

const NEXT_STATUS: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
  BLOCKED: "TODO",
};

export function TasksPanel({ opportunityId, tasks }: { opportunityId: string; tasks: TaskItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");

  const addTask = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        await createTask({ opportunityId, title: title.trim() });
        setTitle("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear tarea");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Nueva tarea…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <Button onClick={addTask} disabled={isPending}>
          Agregar
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tareas todavía.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex items-start justify-between gap-3 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        task.status === "DONE" && "text-slate-400 line-through",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.isRequirement && <Badge variant="outline">Requisito</Badge>}
                    {task.createdFromAi && <Badge variant="secondary">IA</Badge>}
                  </div>
                  {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                  {task.dueDate && <p className="text-xs text-slate-400">Vence: {formatDate(task.dueDate)}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      startTransition(async () => {
                        await updateTaskStatus(task.id, NEXT_STATUS[task.status]);
                      })
                    }
                  >
                    {STATUS_LABEL[task.status]}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteTask(task.id);
                      })
                    }
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
