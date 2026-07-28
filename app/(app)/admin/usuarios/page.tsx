import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { NewUserForm } from "./new-user-form";
import { RoleSelect } from "./role-select";

export default async function UsuariosPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Usuarios</h1>
        <div className="space-y-2">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user.name} <Badge variant="outline" className="ml-2">{user.email}</Badge>
                  </p>
                  <p className="text-xs text-slate-400">Desde {formatDate(user.createdAt)}</p>
                </div>
                <RoleSelect userId={user.id} role={user.role} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <NewUserForm />
        </CardContent>
      </Card>
    </div>
  );
}
