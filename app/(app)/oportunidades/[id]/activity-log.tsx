import { formatDate } from "@/lib/utils";

type ActivityItem = {
  id: string;
  action: string;
  createdAt: Date;
  user: { name: string } | null;
};

const ACTION_LABEL: Record<string, string> = {
  OPORTUNIDAD_CREADA: "marcó la licitación como interesante",
  CAMBIO_ESTADO: "cambió el estado del pipeline",
  REASIGNADA: "reasignó la oportunidad",
  TAREA_CREADA: "creó una tarea",
  TAREA_ACTUALIZADA: "actualizó una tarea",
  TAREA_ELIMINADA: "eliminó una tarea",
  DOCUMENTO_SUBIDO: "subió un documento",
  DOCUMENTO_ELIMINADO: "eliminó un documento",
  NOTA_AGREGADA: "agregó una nota",
  RECORDATORIO_CREADO: "creó un recordatorio",
  ANALISIS_IA_GENERADO: "generó un análisis con IA",
  TAREAS_GENERADAS_DESDE_IA: "generó tareas desde el análisis de IA",
};

export function ActivityLog({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-slate-400">Sin actividad todavía.</p>;
  }

  return (
    <ul className="space-y-3 border-l border-slate-200 pl-4">
      {activity.map((item) => (
        <li key={item.id} className="text-sm">
          <span className="font-medium text-slate-800">{item.user?.name ?? "Sistema"}</span>{" "}
          <span className="text-slate-600">{ACTION_LABEL[item.action] ?? item.action}</span>
          <div className="text-xs text-slate-400">{formatDate(item.createdAt)}</div>
        </li>
      ))}
    </ul>
  );
}
