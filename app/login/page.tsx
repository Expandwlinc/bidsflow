import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-slate-900">BidsFlow</h1>
          <p className="text-sm text-slate-500">CRM de licitaciones — PanamaCompra</p>
        </div>
        <LoginForm callbackUrl={params.callbackUrl} hasError={!!params.error} />
      </div>
    </div>
  );
}
