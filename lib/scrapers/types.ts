export interface TenderCandidate {
  externalId: string;
  title: string;
  entity: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: "PUBLICADO" | "ABIERTO" | "CERRADO" | "ADJUDICADO" | "CANCELADO" | "DESCONOCIDO";
  category?: string;
  procurementMethod?: string;
  publishDate?: Date;
  closingDate?: Date;
  actDate?: Date;
  url?: string;
  pliegoDocumentUrl?: string;
  raw?: unknown;
}

export interface ScraperConnector {
  name: string;
  source: "OCDS_BULK" | "PORTAL_SCRAPE";
  fetchCandidates(): Promise<TenderCandidate[]>;
}
