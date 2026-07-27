import "server-only";
import * as cheerio from "cheerio";
import type { ScraperConnector, TenderCandidate } from "./types";

/**
 * Conector EXPERIMENTAL / requiere verificación.
 *
 * Intenta obtener licitaciones "en curso" directamente del portal transaccional
 * (`www.panamacompra.gob.pa`), que tiene mayor frescura que la descarga masiva
 * OCDS (esa se actualiza semanalmente). No fue posible verificar la estructura
 * HTML real del portal desde este entorno de desarrollo (las solicitudes salientes
 * a panamacompra.gob.pa devolvieron 403 — posible bloqueo geográfico o anti-bot).
 *
 * Por eso este conector:
 *   1. Está deshabilitado por defecto (ver `PORTAL_LIVE_SCRAPER_ENABLED`).
 *   2. Nunca debe hacer fallar toda la corrida del scraper — cualquier error se
 *      captura y se reporta, dejando que el conector OCDS_BULK siga funcionando.
 *   3. Debe probarse y ajustarse (selectores CSS, paginación, parámetros de
 *      búsqueda) con acceso real al sitio antes de confiar en sus resultados.
 *
 * Antes de habilitarlo en producción: abre el buscador de "Procesos de
 * Contratación" en panamacompra.gob.pa, inspecciona el HTML de resultados, y
 * ajusta los selectores en `parseSearchResults` según corresponda.
 */
export class PortalLiveConnector implements ScraperConnector {
  name = "Portal en vivo (panamacompra.gob.pa) — experimental";
  source = "PORTAL_SCRAPE" as const;

  private baseUrl = process.env.PORTAL_BASE_URL ?? "https://www.panamacompra.gob.pa";

  async fetchCandidates(): Promise<TenderCandidate[]> {
    if (process.env.PORTAL_LIVE_SCRAPER_ENABLED !== "true") {
      return [];
    }

    const res = await fetch(`${this.baseUrl}/Busquedas/BusquedaAvanzada`, {
      headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; BidsFlowBot/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Portal en vivo respondió ${res.status} — revisar selectores/URL (ver comentarios del archivo)`);
    }

    const html = await res.text();
    return parseSearchResults(html);
  }
}

function parseSearchResults(html: string): TenderCandidate[] {
  const $ = cheerio.load(html);
  const candidates: TenderCandidate[] = [];

  // Selectores de mejor esfuerzo — NO VERIFICADOS contra el HTML real.
  // Ajustar `row.select` y los `.text()` de cada celda tras inspeccionar el DOM real.
  $("table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const externalId = $(cells[0]).text().trim();
    const title = $(cells[1]).text().trim();
    const entity = $(cells[2]).text().trim();
    if (!externalId || !title) return;

    candidates.push({ externalId, title, entity: entity || "Entidad desconocida", status: "ABIERTO" });
  });

  return candidates;
}
