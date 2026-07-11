<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DocumentDto } from '@homedocs/shared-types'
import { ApiError } from '../api/client'
import { documentsApi } from '../api/documents'
import CategoryIcon from '../components/CategoryIcon.vue'
import PageHeader from '../components/PageHeader.vue'
import VisibilityBadge from '../components/VisibilityBadge.vue'
import { useCategories } from '../composables/useCategories'
import { useCategoryStyle } from '../composables/useCategoryStyle'
import { useAuthStore } from '../stores/auth'
import { formatDate } from '../utils/dates'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { categories, load: loadCategories } = useCategories()
const { labelOf } = useCategoryStyle(() => categories.value)

const doc = ref<DocumentDto | null>(null)
const error = ref('')
const busy = ref(false)

/** Il toggle di visibilità esiste solo per il proprietario (regola 3bis). */
const isOwner = computed(() => doc.value?.uploadedBy === auth.user?.id)
/** Il pagamento ha senso solo per le categorie che lo prevedono (es. visite mediche). */
const wantsPagamento = computed(() => {
  const cat = categories.value.find((c) => c.nome === doc.value?.categoria)
  return cat?.templateCampi.includes('importo') ?? false
})

let pollTimer: ReturnType<typeof setInterval> | undefined

/** Finché l'OCR è in corso, aggiorna il documento ogni 3 secondi. */
function pollWhilePending() {
  clearInterval(pollTimer)
  if (doc.value?.statoOcr !== 'pending') return
  pollTimer = setInterval(async () => {
    try {
      const d = await documentsApi.get(route.params.id as string)
      doc.value = d
      if (d.statoOcr !== 'pending') clearInterval(pollTimer)
    } catch {
      clearInterval(pollTimer)
    }
  }, 3000)
}

onMounted(async () => {
  try {
    const [d] = await Promise.all([
      documentsApi.get(route.params.id as string),
      loadCategories(),
    ])
    doc.value = d
    pollWhilePending()
  } catch (e) {
    error.value = e instanceof ApiError && e.status === 404 ? 'Documento non trovato' : 'Errore di caricamento'
  }
})

onUnmounted(() => clearInterval(pollTimer))

async function toggleVisibility() {
  if (!doc.value || busy.value) return
  busy.value = true
  try {
    doc.value = await documentsApi.setVisibility(
      doc.value.id,
      doc.value.visibilita === 'privato' ? 'condiviso' : 'privato',
    )
  } finally {
    busy.value = false
  }
}

async function openFile() {
  if (!doc.value) return
  const { url } = await documentsApi.fileUrl(doc.value.id)
  window.open(url, '_blank')
}

async function onDelete() {
  if (!doc.value || !confirm(`Eliminare "${doc.value.titolo}"? L'operazione è definitiva.`)) return
  await documentsApi.remove(doc.value.id)
  await router.push({ name: 'privato' })
}

// --- Form pagamento ---
const showPagamentoForm = ref(false)
const pagamentoForm = ref({ importo: '', metodoPagamento: '', dataPagamento: '' })
const pagamentoError = ref('')
const pagamentoSaving = ref(false)

function openPagamentoForm() {
  const p = doc.value?.pagamento
  pagamentoForm.value = {
    importo: p ? String(p.importo) : '',
    metodoPagamento: p?.metodoPagamento ?? '',
    dataPagamento: p ? p.dataPagamento.slice(0, 10) : (doc.value?.dataDocumento.slice(0, 10) ?? ''),
  }
  pagamentoError.value = ''
  showPagamentoForm.value = true
}

async function savePagamento() {
  if (!doc.value) return
  pagamentoError.value = ''
  pagamentoSaving.value = true
  try {
    doc.value = await documentsApi.update(doc.value.id, {
      pagamento: {
        importo: Number(pagamentoForm.value.importo),
        valuta: doc.value.pagamento?.valuta ?? 'EUR',
        metodoPagamento: pagamentoForm.value.metodoPagamento,
        dataPagamento: pagamentoForm.value.dataPagamento,
      },
    })
    showPagamentoForm.value = false
  } catch (e) {
    pagamentoError.value = e instanceof ApiError ? e.message : 'Errore durante il salvataggio'
  } finally {
    pagamentoSaving.value = false
  }
}

async function removePagamento() {
  if (!doc.value || !confirm('Rimuovere il pagamento registrato per questo documento?')) return
  doc.value = await documentsApi.update(doc.value.id, { pagamento: null })
}

const ocrLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Estrazione dati in corso…', cls: 'bg-surface-alt text-ink-soft animate-pulse' },
  completato: { label: 'Dati estratti', cls: 'bg-[#E7F3EA] text-success' },
  errore: { label: 'OCR fallito', cls: 'bg-[#FCE9E9] text-danger' },
}

const inputClass =
  'h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand'
</script>

<template>
  <PageHeader :title="doc?.titolo ?? 'Documento'" :subtitle="doc ? labelOf(doc.categoria) : ''" />

  <main class="px-8 pb-11 pt-7">
    <p v-if="error" class="text-sm font-bold text-danger">{{ error }}</p>

    <div v-else-if="doc" class="mx-auto flex max-w-[720px] flex-col gap-5">
      <section
        class="flex flex-col gap-5 rounded-[18px] border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <div class="flex items-start gap-4">
          <CategoryIcon :categoria="doc.categoria" :size="52" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2.5">
              <h2 class="m-0 text-lg font-extrabold">{{ doc.titolo }}</h2>
              <VisibilityBadge :visibilita="doc.visibilita" />
              <span
                class="rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
                :class="ocrLabels[doc.statoOcr]?.cls"
                >{{ ocrLabels[doc.statoOcr]?.label }}</span
              >
            </div>
            <p v-if="doc.descrizione" class="mb-0 mt-1.5 text-[13.5px] text-ink-soft">
              {{ doc.descrizione }}
            </p>
          </div>
        </div>

        <dl class="m-0 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Data documento</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ formatDate(doc.dataDocumento) }}</dd>
          </div>
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Scadenza</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ formatDate(doc.dataScadenza) }}</dd>
          </div>
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Caricato il</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ formatDate(doc.createdAt) }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-3 border-t border-line-soft pt-5">
          <button
            class="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white hover:bg-brand-dark"
            @click="openFile"
          >
            <span class="ms text-[20px]">open_in_new</span>Apri file
          </button>
          <button
            v-if="isOwner"
            :disabled="busy"
            class="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[11px] border border-line bg-surface px-[17px] text-[13.5px] font-bold text-ink-soft hover:bg-surface-alt disabled:opacity-60"
            @click="toggleVisibility"
          >
            <span class="ms text-[20px]">{{ doc.visibilita === 'privato' ? 'groups' : 'lock' }}</span>
            {{ doc.visibilita === 'privato' ? 'Condividi con la famiglia' : 'Rendi privato' }}
          </button>
          <button
            v-if="isOwner"
            class="ml-auto inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[11px] border border-[#F3D6D2] bg-surface px-[17px] text-[13.5px] font-bold text-danger hover:bg-[#FCE9E9]"
            @click="onDelete"
          >
            <span class="ms text-[20px]">delete</span>Elimina
          </button>
        </div>
      </section>

      <section
        v-if="isOwner && doc.visibilita === 'privato'"
        class="flex items-center gap-3 rounded-[14px] border border-line bg-surface-alt px-4 py-3"
      >
        <span class="ms text-[20px] text-ink-soft">lock</span>
        <p class="m-0 text-[12.5px] font-semibold text-ink-soft">
          Questo documento è nel tuo spazio privato: <strong>solo tu lo vedi</strong>.
        </p>
      </section>

      <section
        v-if="doc.datiEstratti && Object.keys(doc.datiEstratti).length"
        class="rounded-[18px] border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <h3 class="m-0 mb-3 text-[15px] font-extrabold">Dati estratti</h3>
        <dl class="m-0 grid grid-cols-2 gap-x-6 gap-y-3">
          <div v-for="(v, k) in doc.datiEstratti" :key="k">
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">{{ k }}</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ v }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="doc.pagamento || (isOwner && wantsPagamento)"
        class="rounded-[18px] border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <div class="flex items-center justify-between gap-3">
          <h3 class="m-0 text-[15px] font-extrabold">Pagamento</h3>
          <div v-if="isOwner" class="flex gap-2">
            <button
              class="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[12.5px] font-bold text-brand hover:text-brand-dark"
              @click="openPagamentoForm"
            >
              <span class="ms text-[17px]">{{ doc.pagamento ? 'edit' : 'add' }}</span>
              {{ doc.pagamento ? 'Modifica' : 'Registra pagamento' }}
            </button>
            <button
              v-if="doc.pagamento"
              class="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[12.5px] font-bold text-danger hover:text-[#a3291d]"
              @click="removePagamento"
            >
              <span class="ms text-[17px]">delete</span>Rimuovi
            </button>
          </div>
        </div>

        <dl v-if="doc.pagamento" class="m-0 mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Importo</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">
              {{ doc.pagamento.importo.toFixed(2) }} {{ doc.pagamento.valuta }}
            </dd>
          </div>
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Metodo</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ doc.pagamento.metodoPagamento }}</dd>
          </div>
          <div>
            <dt class="text-[11.5px] font-bold uppercase tracking-wide text-ink-mute">Data</dt>
            <dd class="m-0 mt-0.5 text-sm font-bold">{{ formatDate(doc.pagamento.dataPagamento) }}</dd>
          </div>
        </dl>
        <p v-else class="m-0 mt-2 text-[12.5px] font-semibold text-ink-mute">
          Nessun pagamento registrato per questo documento.
        </p>
      </section>
    </div>
  </main>

  <!-- Modal registra/modifica pagamento -->
  <div
    v-if="showPagamentoForm"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
    @click.self="showPagamentoForm = false"
  >
    <form
      class="flex w-full max-w-[420px] flex-col gap-4 rounded-[18px] border border-line bg-surface p-6 shadow-xl"
      @submit.prevent="savePagamento"
    >
      <h2 class="m-0 text-lg font-extrabold">
        {{ doc?.pagamento ? 'Modifica pagamento' : 'Registra pagamento' }}
      </h2>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Importo (€)</span>
          <input
            v-model="pagamentoForm.importo"
            type="number"
            step="0.01"
            min="0"
            required
            :class="inputClass"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Metodo</span>
          <select v-model="pagamentoForm.metodoPagamento" required :class="inputClass">
            <option value="" disabled>Scegli…</option>
            <option value="Carta">Carta</option>
            <option value="Contanti">Contanti</option>
            <option value="Bonifico">Bonifico</option>
            <option value="Addebito diretto">Addebito diretto</option>
          </select>
        </label>
        <label class="col-span-2 flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Data pagamento</span>
          <input v-model="pagamentoForm.dataPagamento" type="date" required :class="inputClass" />
        </label>
      </div>
      <p v-if="pagamentoError" class="m-0 text-[12.5px] font-bold text-danger">{{ pagamentoError }}</p>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="inline-flex h-[42px] items-center rounded-[11px] border border-line bg-surface px-[17px] text-[13.5px] font-bold text-ink-soft hover:bg-surface-alt"
          @click="showPagamentoForm = false"
        >
          Annulla
        </button>
        <button
          type="submit"
          :disabled="pagamentoSaving"
          class="inline-flex h-[42px] cursor-pointer items-center rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {{ pagamentoSaving ? 'Salvataggio…' : 'Salva' }}
        </button>
      </div>
    </form>
  </div>
</template>
