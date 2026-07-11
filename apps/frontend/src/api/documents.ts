import type {
  DocumentCategoryDto,
  DocumentDto,
  DocumentListQueryDto,
  PagamentoDto,
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
  vehicleId?: string
  pagamento?: PagamentoDto
}

export const documentsApi = {
  list(query: DocumentListQueryDto = {}) {
    return api.get<PaginatedDto<DocumentDto>>('/documents', {
      categoria: query.categoria,
      tipo: query.tipo,
      vehicleId: query.vehicleId,
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
    if (input.vehicleId) fd.set('vehicleId', input.vehicleId)
    if (input.pagamento) {
      // notazione bracket: class-transformer la ricompone in oggetto annidato lato backend
      fd.set('pagamento[importo]', String(input.pagamento.importo))
      fd.set('pagamento[valuta]', input.pagamento.valuta)
      fd.set('pagamento[metodoPagamento]', input.pagamento.metodoPagamento)
      fd.set('pagamento[dataPagamento]', input.pagamento.dataPagamento)
    }
    return api.postForm<DocumentDto>('/documents', fd)
  },

  update(
    id: string,
    body: Partial<Omit<UploadDocumentInput, 'pagamento'>> & {
      datiEstratti?: Record<string, unknown>
      pagamento?: PagamentoDto | null
    },
  ) {
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
