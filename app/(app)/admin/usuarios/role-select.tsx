"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole } from "@/lib/actions/users";

export function RoleSelect({ userId, role }: { userId: string; role: "ADMIN" | "VENDEDOR" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={role}
      disabled={isPending}
      onValueChange={(value) => {
        startTransition(async () => {
          try {
            await updateUserRole(userId, value as "ADMIN" | "VENDEDOR");
            toast.success("Rol actualizado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al actualizar rol");
          }
        });
      }}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="VENDEDOR">Vendedor</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
