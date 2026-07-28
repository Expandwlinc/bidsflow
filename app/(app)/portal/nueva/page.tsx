import { NewTenderForm } from "./new-tender-form";

export default function NewTenderPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Agregar licitación manualmente</h1>
        <p className="text-sm text-slate-500">
          Útil mientras el scraper automático se ajusta, o para procesos que no aparecen en la fuente de datos abierta.
        </p>
      </div>
      <NewTenderForm />
    </div>
  );
}
