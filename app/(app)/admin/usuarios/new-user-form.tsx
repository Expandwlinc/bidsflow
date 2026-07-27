"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUser } from "@/lib/actions/users";

export function NewUserForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await createUser({
          name: String(formData.get("name")),
          email: String(formData.get("email")),
          password: String(formData.get("password")),
          role: formData.get("role") as "ADMIN" | "VENDEDOR",
        });
        toast.success("Usuario creado");
        formRef.current?.reset();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al crear usuario");
      }
    });
  };

  return (
    <form ref={formRef} action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña temporal</Label>
        <Input id="password" name="password" type="text" required minLength={8} />
      </div>
      <div className="space-y-1.5">
        <Label>Rol</Label>
        <Select name="role" defaultValue="VENDEDOR">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VENDEDOR">Vendedor</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creando…" : "Crear usuario"}
      </Button>
    </form>
  );
}
