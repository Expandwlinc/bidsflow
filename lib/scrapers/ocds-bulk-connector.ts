import "server-only";
import type { ScraperConnector, TenderCandidate } from "./types";

/**
 * Conector primario: usa la descarga masiva en formato OCDS (Open Contracting
 * Data Standard) de "PanamaCompraenCifras" — la fuente de datos abiertos oficial
 * de la Dirección General de Contrataciones Públicas de Panamá.
 *
 * ADVERTENCIA: el dominio base (`OCDS_BASE_URL`) apunta al entorno observado
 * durante el desarrollo (`ocdsv2dev...`), que parece ser un ambiente de
 * desarrollo/pruebas, no necesariamente el de producción. Verifica el dominio
 * correcto antes de depender de este conector en producción. Esta fuente se
 * actualiza semanalmente (no a diario), por lo que complementa — no reemplaza —
 * al conector del portal en vivo para procesos "en curso".
 *
 * El parseo es intencionalmente defensivo (try/catch por registro) porque no
 * fue posible verificar la forma exacta del JSON contra el servidor real desde
 * este entorno de desarrollo (bloqueo de red). Sigue la forma estándar de un
 * "release package" / "record package" de OCDS.
 */
export class OcdsBulkConnector implements ScraperConnector {
  name = "OCDS Bulk (PanamaCompraenCifras)";
  source = "OCDS_BULK" as const;

  private baseUrl = process.env.OCDS_BASE_URL ?? "https://ocdsv2dev.panamacompraencifras.gob.pa";

  async fetchCandidates(): Promise<TenderCandidate[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const url = `${this.baseUrl}/api/v1/file/panamacompra_v2/json/${year}/${month}/es`;

    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`OCDS bulk fetch falló (${res.status}) en ${url}`);
    }

    const data = (await res.json()) as OcdsPackage;
    const releases = normalizeToReleases(data);

    const candidates: TenderCandidate[] = [];
    for (const release of releases) {
      try {
        const candidate = releaseToCandidate(release);
        if (candidate) candidates.push(candidate);
      } catch {
        // Un registro individual con forma inesperada no debe tumbar toda la corrida.
        continue;
      }
    }
    return candidates;
  }
}

// --- Tipos y helpers de parseo OCDS (defensivos) ---------------------------

interface OcdsPackage {
  releases?: OcdsRelease[];
  records?: { compiledRelease?: OcdsRelease }[];
}

interface OcdsRelease {
  ocid?: string;
  id?: string;
  date?: string;
  tender?: {
    id?: string;
    title?: string;
    description?: string;
    status?: string;
    value?: { amount?: number; currency?: string };
    tenderPeriod?: { startDate?: string; endDate?: string };
    procurementMethod?: string;
    procurementMethodDetails?: string;
    documents?: { documentType?: string; url?: string }[];
  };
  buyer?: { name?: string };
  parties?: { id?: string; name?: string; roles?: string[] }[];
}

function normalizeToReleases(pkg: OcdsPackage): OcdsRelease[] {
  if (Array.isArray(pkg.releases)) return pkg.releases;
  if (Array.isArray(pkg.records)) {
    return pkg.records.map((r) => r.compiledRelease).filter((r): r is OcdsRelease => !!r);
  }
  return [];
}

function mapStatus(status?: string): TenderCandidate["status"] {
  switch ((status ?? "").toLowerCase()) {
    case "active":
    case "tender":
      return "ABIERTO";
    case "planning":
    case "planned":
      return "PUBLICADO";
    case "complete":
    case "awarded":
      return "ADJUDICADO";
    case "cancelled":
    case "unsuccessful":
      return "CANCELADO";
    default:
      return "DESCONOCIDO";
  }
}

function releaseToCandidate(release: OcdsRelease): TenderCandidate | null {
  const tender = release.tender;
  const externalId = tender?.id ?? release.ocid ?? release.id;
  if (!externalId || !tender?.title) return null;

  const buyerName =
    release.buyer?.name ?? release.parties?.find((p) => p.roles?.includes("buyer"))?.name ?? "Entidad desconocida";

  const pliego = tender.documents?.find((d) => (d.documentType ?? "").toLowerCase().includes("biddingdocuments"));

  return {
    externalId: String(externalId),
    title: tender.title,
    entity: buyerName,
    description: tender.description,
    amount: tender.value?.amount,
    currency: tender.value?.currency ?? "USD",
    status: mapStatus(tender.status),
    procurementMethod: tender.procurementMethod ?? tender.procurementMethodDetails,
    closingDate: tender.tenderPeriod?.endDate ? new Date(tender.tenderPeriod.endDate) : undefined,
    publishDate: release.date ? new Date(release.date) : undefined,
    pliegoDocumentUrl: pliego?.url,
    raw: release,
  };
}
