<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { VehicleDto } from '@homedocs/shared-types'
import { ApiError } from '../api/client'
import { documentsApi } from '../api/documents'
import { vehiclesApi } from '../api/vehicles'
import PageHeader from '../components/PageHeader.vue'
import { useCategories } from '../composables/useCategories'
import { useCategoryStyle } from '../composables/useCategoryStyle'

const router = useRouter()
const { categories, load: loadCategories } = useCategories()
const { labelOf, tipoOf } = useCategoryStyle(() => categories.value)

const file = ref<File | null>(null)
const dragging = ref(false)
const vehicles = ref<VehicleDto[]>([])
const form = ref({
  categoria: '',
  titolo: '',
  descrizione: '',
  dataDocumento: new Date().toISOString().slice(0, 10),
  dataScadenza: '',
  vehicleId: '',
})
const registraPagamento = ref(false)
const pagamento = ref({ importo: '', metodoPagamento: '', dataPagamento: '' })
const error = ref('')
const loading = ref(false)

const selectedCategory = computed(() =>
  categories.value.find((c) => c.nome === form.value.categoria),
)
const wantsScadenza = computed(
  () => selectedCategory.value?.templateCampi.includes('dataScadenza') ?? false,
)
/** Il campo pagamento compare solo per le categorie che lo prevedono (es. visite mediche). */
const wantsPagamento = computed(
  () => selectedCategory.value?.templateCampi.includes('importo') ?? false,
)
/** Il selettore veicolo compare solo per le categorie di tipo "auto". */
const isAuto = computed(() => !!form.value.categoria && tipoOf(form.value.categoria) === 'auto')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  pickFile(input.files?.[0] ?? null)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  pickFile(e.dataTransfer?.files[0] ?? null)
}

function pickFile(f: File | null) {
  file.value = f
  if (f && !form.value.titolo) {
    form.value.titolo = f.name.replace(/\.[^.]+$/, '').replaceAll(/[_-]+/g, ' ')
  }
}

async function onSubmit() {
  if (!file.value) {
    error.value = 'Seleziona un file da caricare'
    return
  }
  if (wantsPagamento.value && registraPagamento.value && !pagamento.value.metodoPagamento) {
    error.value = 'Indica il metodo di pagamento'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const doc = await documentsApi.upload({
      file: file.value,
      categoria: form.value.categoria,
      titolo: form.value.titolo,
      descrizione: form.value.descrizione || undefined,
      dataDocumento: form.value.dataDocumento,
      dataScadenza: form.value.dataScadenza || undefined,
      vehicleId: isAuto.value ? form.value.vehicleId || undefined : undefined,
      pagamento:
        wantsPagamento.value && registraPagamento.value
          ? {
              importo: Number(pagamento.value.importo),
              valuta: 'EUR',
              metodoPagamento: pagamento.value.metodoPagamento,
              dataPagamento: pagamento.value.dataPagamento || form.value.dataDocumento,
            }
          : undefined,
    })
    await router.push({ name: 'documento', params: { id: doc.id } })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Errore durante il caricamento'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  vehicles.value = await vehiclesApi.list()
})

const inputClass =
  'h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand'
</script>

<template>
  <PageHeader title="Nuovo documento" subtitle="Il documento sarà visibile solo a te finché non decidi di condividerlo" />

  <main class="px-8 pb-11 pt-7">
    <form class="mx-auto flex max-w-[640px] flex-col gap-5" @submit.prevent="onSubmit">
      <!-- Dropzone -->
      <label
        class="flex cursor-pointer flex-col items-center gap-2.5 rounded-[18px] border-2 border-dashed px-6 py-10 text-center transition-colors"
        :class="dragging ? 'border-brand bg-brand-tint' : 'border-line bg-surface'"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <input type="file" class="hidden" accept=".pdf,image/*" @change="onFileChange" />
        <span class="ms text-[42px]" :class="dragging ? 'text-brand' : 'text-ink-faint'"
          >upload_file</span
        >
        <template v-if="file">
          <p class="m-0 text-sm font-bold">{{ file.name }}</p>
          <p class="m-0 text-[12.5px] font-semibold text-ink-mute">
            {{ (file.size / 1024).toFixed(0) }} KB · clicca per sostituire
          </p>
        </template>
        <template v-else>
          <p class="m-0 text-sm font-bold">Trascina qui il file, o clicca per sceglierlo</p>
          <p class="m-0 text-[12.5px] font-semibold text-ink-mute">PDF o immagini, max 20 MB</p>
        </template>
      </label>

      <div
        class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Categoria</span>
          <select v-model="form.categoria" required :class="inputClass">
            <option value="" disabled>Scegli una categoria…</option>
            <option v-for="c in categories" :key="c.id" :value="c.nome">
              {{ labelOf(c.nome) }}
            </option>
          </select>
        </label>

        <label v-if="isAuto" class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Veicolo (facoltativo)</span>
          <select v-model="form.vehicleId" :class="inputClass">
            <option value="">Nessun veicolo</option>
            <option v-for="v in vehicles" :key="v.id" :value="v.id">
              {{ v.marca }} {{ v.modello }} · {{ v.targa }}
            </option>
          </select>
          <span v-if="!vehicles.length" class="text-[11px] font-semibold text-ink-mute">
            Nessun veicolo: aggiungine uno da "Documenti auto".
          </span>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Titolo</span>
          <input v-model="form.titolo" required placeholder="es. Bolletta luce marzo" :class="inputClass" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Descrizione (facoltativa)</span>
          <textarea
            v-model="form.descrizione"
            rows="2"
            class="rounded-[11px] border border-line bg-surface px-3.5 py-2.5 text-[13.5px] outline-none focus:border-brand"
          ></textarea>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft">Data documento</span>
            <input v-model="form.dataDocumento" type="date" required :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft"
              >Scadenza {{ wantsScadenza ? '' : '(se prevista)' }}</span
            >
            <input v-model="form.dataScadenza" type="date" :class="inputClass" />
          </label>
        </div>

        <div v-if="wantsPagamento" class="flex flex-col gap-3 border-t border-line-soft pt-4">
          <label class="flex cursor-pointer items-center gap-2.5">
            <input v-model="registraPagamento" type="checkbox" class="h-4 w-4 accent-brand" />
            <span class="text-[12.5px] font-bold text-ink-soft">Registra un pagamento</span>
          </label>

          <div v-if="registraPagamento" class="grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-1.5">
              <span class="text-[12.5px] font-bold text-ink-soft">Importo (€)</span>
              <input
                v-model="pagamento.importo"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                :class="inputClass"
              />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[12.5px] font-bold text-ink-soft">Metodo</span>
              <select v-model="pagamento.metodoPagamento" required :class="inputClass">
                <option value="" disabled>Scegli…</option>
                <option value="Carta">Carta</option>
                <option value="Contanti">Contanti</option>
                <option value="Bonifico">Bonifico</option>
                <option value="Addebito diretto">Addebito diretto</option>
              </select>
            </label>
            <label class="col-span-2 flex flex-col gap-1.5">
              <span class="text-[12.5px] font-bold text-ink-soft"
                >Data pagamento (se diversa dalla data documento)</span
              >
              <input v-model="pagamento.dataPagamento" type="date" :class="inputClass" />
            </label>
          </div>
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-[14px] border border-line bg-surface-alt px-4 py-3"
      >
        <span class="ms text-[20px] text-ink-soft">lock</span>
        <p class="m-0 text-[12.5px] font-semibold text-ink-soft">
          <strong>Privacy:</strong> il documento nasce privato ("Solo tu lo vedi"). Potrai
          condividerlo con la famiglia dalla pagina del documento.
        </p>
      </div>

      <p v-if="error" class="m-0 text-[12.5px] font-bold text-danger">{{ error }}</p>

      <div class="flex justify-end gap-3">
        <RouterLink
          :to="{ name: 'dashboard' }"
          class="inline-flex h-[42px] items-center rounded-[11px] border border-line bg-surface px-[17px] text-[13.5px] font-bold text-ink-soft hover:bg-surface-alt"
          >Annulla</RouterLink
        >
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white shadow-[0_4px_12px_rgba(196,98,45,.28)] hover:bg-brand-dark disabled:opacity-60"
        >
          <span class="ms text-[20px]">upload</span>
          {{ loading ? 'Caricamento…' : 'Carica documento' }}
        </button>
      </div>
    </form>
  </main>
</template>
