import type { EntityId, TipoCategoria } from './common';

/** Configurazione categoria documento (collection `documentCategories`, non hardcoded). */
export interface DocumentCategoryDto {
  id: EntityId;
  /** Slug usato come `DocumentDto.categoria`, es. "visita_medica". */
  nome: string;
  tipo: TipoCategoria;
  /** Campi suggeriti/attesi per i documenti di questa categoria. */
  templateCampi: string[];
}
