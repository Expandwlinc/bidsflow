import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TotpSetup } from "./totp-setup";

export default async function CuentaPage() {
  const sessionUser = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Mi cuenta</h1>
        <p className="text-sm text-slate-500">{user.name} · {user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Autenticación en dos pasos</CardTitle>
        </CardHeader>
        <CardContent>
          <TotpSetup enabled={user.totpEnabled} />
        </CardContent>
      </Card>
    </div>
  );
}
