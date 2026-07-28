"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkCredentials } from "@/lib/actions/auth";

export function LoginForm({ callbackUrl, hasError }: { callbackUrl?: string; hasError?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(hasError ? "Credenciales inválidas" : null);

  const [step, setStep] = useState<"credenciales" | "codigo">("credenciales");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitCredentials = () => {
    setError(null);
    startTransition(async () => {
      const result = await checkCredentials(email, password);
      if (!result.ok) {
        setError("Correo o contraseña incorrectos");
        return;
      }
      if (result.requiresTotp) {
        setStep("codigo");
        return;
      }
      await completeSignIn();
    });
  };

  const submitCode = (formData: FormData) => {
    setError(null);
    const code = String(formData.get("code") || "");
    startTransition(async () => {
      await completeSignIn(code);
    });
  };

  const completeSignIn = async (code?: string) => {
    const res = await signIn("credentials", { email, password, code, redirect: false });
    if (res?.error) {
      setError(code !== undefined ? "Código inválido" : "Correo o contraseña incorrectos");
      return;
    }
    router.push(callbackUrl || "/portal");
    router.refresh();
  };

  if (step === "codigo") {
    return (
      <form key="codigo" action={submitCode} className="space-y-4">
        <p className="text-sm text-slate-500">
          Ingresa el código de 6 dígitos de tu app de autenticación (Google Authenticator, Authy, etc.).
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="code">Código de autenticación</Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verificando…" : "Verificar"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-slate-400 underline"
          onClick={() => {
            setStep("credenciales");
            setError(null);
          }}
        >
          Volver
        </button>
      </form>
    );
  }

  return (
    <form key="credenciales" action={() => submitCredentials()} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
