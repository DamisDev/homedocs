import type {
  DocumentCategoryDto,
  DocumentDto,
  DocumentListQueryDto,
  PaginatedDto,
  Visibilita,
} from '@homedocs/shared-types'
import { api } from './client'

export interface UploadDocumentInput {
  file: File
  categoria: string
  titolo: string
  descrizione?: string
  dataDocumento: string
  dataScadenza?: string
  pagamento?: { importo: number; valuta: string; metodoPagamento: string; dataPagamento: string }
}

export const documentsApi = {
  list(query: DocumentListQueryDto = {}) {
    return api.get<PaginatedDto<DocumentDto>>('/documents', {
      categoria: query.categoria,
      visibilita: query.visibilita,
      scadenzaEntro: query.scadenzaEntro,
      search: query.search,
      page: query.page,
      limit: query.limit,
    })
  },

  get(id: string) {
    return api.get<DocumentDto>(`/documents/${id}`)
  },

  fileUrl(id: string) {
    return api.get<{ url: string }>(`/documents/${id}/file`)
  },

  upload(input: UploadDocumentInput) {
    const fd = new FormData()
    fd.set('file', input.file)
    fd.set('categoria', input.categoria)
    fd.set('titolo', input.titolo)
    if (input.descrizione) fd.set('descrizione', input.descrizione)
    fd.set('dataDocumento', input.dataDocumento)
    if (input.dataScadenza) fd.set('dataScadenza', input.dataScadenza)
    // i campi annidati del pagamento viaggiano come JSON? No: multipart piatto.
    // Il pagamento si aggiunge in un secondo momento via PATCH (JSON tipato).
    return api.postForm<DocumentDto>('/documents', fd)
  },

  update(id: string, body: Partial<UploadDocumentInput> & { datiEstratti?: Record<string, unknown> }) {
    return api.patch<DocumentDto>(`/documents/${id}`, body)
  },

  setVisibility(id: string, visibilita: Visibilita) {
    return api.patch<DocumentDto>(`/documents/${id}/visibility`, { visibilita })
  },

  remove(id: string) {
    return api.delete<void>(`/documents/${id}`)
  },

  categories() {
    return api.get<DocumentCategoryDto[]>('/categories')
  },
}
