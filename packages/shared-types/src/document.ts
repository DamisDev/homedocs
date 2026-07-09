import type { EntityId, IsoDateString, StatoOcr, Visibilita } from './common';

/**
 * Pagamento embedded nel documento (es. visite mediche).
 * Presente solo dove rilevante — vedi sezione 3 della spec.
 */
export interface PagamentoDto {
  importo: number;
  valuta: string;
  metodoPagamento: string;
  dataPagamento: IsoDateString;
  ricevutaUrl?: string;
}

/**
 * Dati estratti dall'OCR: struttura libera, varia per categoria
 * (schema flessibile Mongo — vedi `datiEstratti` nella spec).
 */
export type DatiEstratti = Record<string, unknown>;

export interface DocumentDto {
  id: EntityId;
  householdId: EntityId;
  uploadedBy: EntityId;
  /** Slug della categoria, es. "visita_medica" | "bollo_auto" | ... (configurabile, non hardcoded). */
  categoria: string;
  titolo: string;
  descrizione?: string;
  fileUrl: string;
  fileType: string;
  dataDocumento: IsoDateString;
  dataScadenza?: IsoDateString | null;
  /** Privacy by default: ogni documento nasce "privato". */
  visibilita: Visibilita;
  datiEstratti?: DatiEstratti;
  statoOcr: StatoOcr;
  pagamento?: PagamentoDto;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * Creazione documento. Il file viaggia come multipart a parte;
 * `visibilita` non è accettata in input: il backend forza "privato".
 */
export interface CreateDocumentDto {
  categoria: string;
  titolo: string;
  descrizione?: string;
  dataDocumento: IsoDateString;
  dataScadenza?: IsoDateString | null;
  pagamento?: PagamentoDto;
  vehicleId?: EntityId;
}

export interface UpdateDocumentDto {
  categoria?: string;
  titolo?: string;
  descrizione?: string;
  dataDocumento?: IsoDateString;
  dataScadenza?: IsoDateString | null;
  datiEstratti?: DatiEstratti;
  pagamento?: PagamentoDto | null;
}

/**
 * Cambio visibilità: endpoint dedicato, permesso solo al proprietario
 * (`uploadedBy`) — vedi sezione 3bis della spec.
 */
export interface ChangeVisibilityDto {
  visibilita: Visibilita;
}

export interface DocumentListQueryDto {
  categoria?: string;
  /** "privato" = solo i miei privati, "condiviso" = bacheca familiare; assente = tutti i visibili. */
  visibilita?: Visibilita;
  scadenzaEntro?: IsoDateString;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
