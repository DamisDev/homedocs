import { createRouter, createWebHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DocumentCategoryDto } from '@homedocs/shared-types'
import UploadView from './UploadView.vue'

const categories = vi.hoisted<DocumentCategoryDto[]>(() => [
  { id: '1', nome: 'altro', tipo: 'altro', templateCampi: [] },
  { id: '2', nome: 'visita_medica', tipo: 'medico', templateCampi: ['dataDocumento', 'importo', 'struttura'] },
  { id: '3', nome: 'bollo_auto', tipo: 'auto', templateCampi: ['dataScadenza', 'importo', 'targa'] },
])

vi.mock('../api/documents', () => ({
  documentsApi: {
    categories: vi.fn().mockResolvedValue(categories),
    upload: vi.fn(),
  },
}))
vi.mock('../api/vehicles', () => ({
  vehiclesApi: { list: vi.fn().mockResolvedValue([]) },
}))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div/>' } },
      { path: '/documenti/:id', name: 'documento', component: { template: '<div/>' } },
    ],
  })
}

describe('UploadView — campi condizionali per categoria', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountReady() {
    const router = makeRouter()
    const wrapper = mount(UploadView, { global: { plugins: [router] } })
    await flushPromises()
    return wrapper
  }

  it('non mostra il campo pagamento per una categoria che non lo prevede', async () => {
    const wrapper = await mountReady()
    await wrapper.get('select').setValue('altro')

    expect(wrapper.text()).not.toContain('Registra un pagamento')
  })

  it('mostra "Registra un pagamento" per una categoria che lo prevede (visita medica)', async () => {
    const wrapper = await mountReady()
    await wrapper.get('select').setValue('visita_medica')

    expect(wrapper.text()).toContain('Registra un pagamento')
    // i campi importo/metodo compaiono solo dopo aver spuntato il checkbox
    expect(wrapper.text()).not.toContain('Importo (€)')
  })

  it('espone importo/metodo/data pagamento dopo aver attivato il checkbox', async () => {
    const wrapper = await mountReady()
    await wrapper.get('select').setValue('visita_medica')
    await wrapper.get('input[type="checkbox"]').setValue(true)

    expect(wrapper.text()).toContain('Importo (€)')
    expect(wrapper.text()).toContain('Metodo')
  })

  it('mostra il selettore veicolo solo per categorie di tipo auto', async () => {
    const wrapper = await mountReady()

    await wrapper.get('select').setValue('visita_medica')
    expect(wrapper.text()).not.toContain('Veicolo')

    await wrapper.get('select').setValue('bollo_auto')
    expect(wrapper.text()).toContain('Veicolo')
  })
})
