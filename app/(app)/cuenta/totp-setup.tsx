"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { beginTotpEnrollment, confirmTotpEnrollment, disableTotp } from "@/lib/actions/totp";

export function TotpSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enrollment, setEnrollment] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="success">Activada</Badge>
          <span className="text-sm text-slate-500">Tu cuenta pide un código de tu app de autenticación al iniciar sesión.</span>
        </div>
        <form
          className="space-y-2"
          action={(formData) => {
            setError(null);
            const code = String(formData.get("code") || "");
            startTransition(async () => {
              try {
                await disableTotp(code);
                toast.success("Autenticación en dos pasos desactivada");
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Error al desactivar");
              }
            });
          }}
        >
          <Label htmlFor="disable-code">Para desactivar, confirma un código actual</Label>
          <div className="flex gap-2">
            <Input id="disable-code" name="code" inputMode="numeric" maxLength={6} required />
            <Button type="submit" variant="destructive" disabled={isPending}>
              Desactivar
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          Protege tu cuenta pidiendo, además de la contraseña, un código de 6 dígitos generado por una app como
          Google Authenticator o Authy.
        </p>
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await beginTotpEnrollment();
              setEnrollment(result);
            })
          }
        >
          Activar autenticación en dos pasos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Escanea este código QR con tu app de autenticación, o ingresa la clave manualmente.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enrollment.qrDataUrl} alt="Código QR para configurar la autenticación en dos pasos" className="h-48 w-48" />
      <p className="break-all rounded-md bg-slate-100 p-2 text-xs font-mono text-slate-600">{enrollment.secret}</p>

      <form
        className="space-y-2"
        action={(formData) => {
          setError(null);
          const code = String(formData.get("code") || "");
          startTransition(async () => {
            try {
              await confirmTotpEnrollment(enrollment.secret, code);
              toast.success("Autenticación en dos pasos activada");
              setEnrollment(null);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Error al confirmar");
            }
          });
        }}
      >
        <Label htmlFor="confirm-code">Código de tu app</Label>
        <div className="flex gap-2">
          <Input id="confirm-code" name="code" inputMode="numeric" maxLength={6} required autoFocus />
          <Button type="submit" disabled={isPending}>
            Confirmar
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <button
        type="button"
        className="text-xs text-slate-400 underline"
        onClick={() => setEnrollment(null)}
      >
        Cancelar
      </button>
    </div>
  );
}
