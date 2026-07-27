"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignOpportunity } from "@/lib/actions/opportunities";

export function AssigneeSelect({
  opportunityId,
  assignedToId,
  users,
}: {
  opportunityId: string;
  assignedToId: string | null;
  users: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={assignedToId ?? "none"}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await assignOpportunity(opportunityId, value === "none" ? null : value);
            toast.success("Asignación actualizada");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al asignar");
          }
        });
      }}
    >
      <SelectTrigger className="w-52">
        <SelectValue placeholder="Sin asignar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin asignar</SelectItem>
        {users.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
