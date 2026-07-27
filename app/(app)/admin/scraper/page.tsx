import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { TriggerScrapeButton } from "./trigger-scrape-button";

const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  SUCCESS: "success",
  RUNNING: "warning",
  FAILED: "destructive",
};

export default async function ScraperAdminPage() {
  const runs = await db.scrapeRun.findMany({ orderBy: { startedAt: "desc" }, take: 30 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Scraper de PanamaCompra</h1>
          <p className="text-sm text-slate-500">
            Corre automáticamente todos los días vía GitHub Actions. Fuente primaria: descarga masiva OCDS de
            PanamaCompraenCifras. El conector del portal en vivo es experimental — ver comentarios en el código.
          </p>
        </div>
        <TriggerScrapeButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de corridas</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-slate-400">Sin corridas todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Fuente</th>
                  <th>Estado</th>
                  <th>Nuevos</th>
                  <th>Actualizados</th>
                  <th>Inicio</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-100">
                    <td className="py-2">{run.source}</td>
                    <td>
                      <Badge variant={statusVariant[run.status] ?? "outline"}>{run.status}</Badge>
                    </td>
                    <td>{run.newCount}</td>
                    <td>{run.updatedCount}</td>
                    <td>{formatDate(run.startedAt)}</td>
                    <td className="max-w-xs truncate text-xs text-red-600">{run.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
