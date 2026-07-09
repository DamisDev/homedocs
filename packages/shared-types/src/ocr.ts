import type { DatiEstratti } from './document';
import type { IsoDateString, StatoOcr } from './common';

/** Risposta del servizio OCR (apps/ocr-service) al backend. */
export interface OcrExtractionResultDto {
  /** Categoria riconosciuta (slug), se il modello è riuscito a classificare il documento. */
  categoriaRiconosciuta?: string;
  dataDocumento?: IsoDateString;
  dataScadenza?: IsoDateString;
  importo?: number;
  /** Tutti i campi estratti, variabili per categoria. */
  datiEstratti: DatiEstratti;
}

/** Stato OCR di un documento, esposto al frontend per il polling durante l'upload. */
export interface OcrStatusDto {
  documentId: string;
  statoOcr: StatoOcr;
  /** Presente solo quando statoOcr === "errore". */
  errore?: string;
}
