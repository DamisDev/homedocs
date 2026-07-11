<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DocumentDto, VehicleDto } from '@homedocs/shared-types'
import { ApiError } from '../api/client'
import { documentsApi } from '../api/documents'
import { vehiclesApi } from '../api/vehicles'
import DocumentRow from '../components/DocumentRow.vue'
import PageHeader from '../components/PageHeader.vue'
import { useCategories } from '../composables/useCategories'
import { daysUntil, formatDate } from '../utils/dates'

const { load: loadCategories } = useCategories()

const vehicles = ref<VehicleDto[]>([])
const docs = ref<DocumentDto[]>([])
const loading = ref(true)

/** Documenti auto senza veicolo associato. */
const orphanDocs = computed(() => docs.value.filter((d) => !d.vehicleId))

function docsOf(vehicleId: string): DocumentDto[] {
  return docs.value.filter((d) => d.vehicleId === vehicleId)
}

/** Prossima scadenza futura più vicina tra i documenti del veicolo. */
function nextExpiry(vehicleId: string): { label: string; tone: 'danger' | 'warning' | 'ok' } | null {
  const upcoming = docsOf(vehicleId)
    .filter((d) => d.dataScadenza)
    .map((d) => ({ date: d.dataScadenza as string, days: daysUntil(d.dataScadenza as string) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0]
  if (!upcoming) return null
  const tone = upcoming.days <= 7 ? 'danger' : upcoming.days <= 30 ? 'warning' : 'ok'
  return { label: formatDate(upcoming.date), tone }
}

const expiryTone: Record<string, string> = {
  danger: 'bg-[#FBE2DE] text-danger',
  warning: 'bg-[#FBF0DA] text-warning',
  ok: 'bg-cat-casa-bg text-cat-casa-fg',
}

async function reload() {
  const [vs, res] = await Promise.all([
    vehiclesApi.list(),
    documentsApi.list({ tipo: 'auto', limit: 100 }),
  ])
  vehicles.value = vs
  docs.value = res.items
  loading.value = false
}

// --- Form aggiungi/modifica veicolo ---
const showForm = ref(false)
const editingId = ref<string | null>(null)
const form = ref({ targa: '', marca: '', modello: '', anno: new Date().getFullYear() })
const formError = ref('')
const saving = ref(false)

function openNew() {
  editingId.value = null
  form.value = { targa: '', marca: '', modello: '', anno: new Date().getFullYear() }
  formError.value = ''
  showForm.value = true
}

function openEdit(v: VehicleDto) {
  editingId.value = v.id
  form.value = { targa: v.targa, marca: v.marca, modello: v.modello, anno: v.anno }
  formError.value = ''
  showForm.value = true
}

async function saveVehicle() {
  formError.value = ''
  saving.value = true
  try {
    const payload = {
      targa: form.value.targa,
      marca: form.value.marca,
      modello: form.value.modello,
      anno: Number(form.value.anno),
    }
    if (editingId.value) {
      await vehiclesApi.update(editingId.value, payload)
    } else {
      await vehiclesApi.create(payload)
    }
    showForm.value = false
    await reload()
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : 'Errore durante il salvataggio'
  } finally {
    saving.value = false
  }
}

async function removeVehicle(v: VehicleDto) {
  const n = docsOf(v.id).length
  const msg = n
    ? `Eliminare ${v.marca} ${v.modello}? I ${n} documenti collegati resteranno ma senza veicolo.`
    : `Eliminare ${v.marca} ${v.modello}?`
  if (!confirm(msg)) return
  await vehiclesApi.remove(v.id)
  await reload()
}

onMounted(async () => {
  await Promise.all([loadCategories(), reload()])
})

const inputClass =
  'h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand'
</script>

<template>
  <PageHeader
    title="Documenti auto"
    subtitle="Scadenze e documenti dei tuoi veicoli"
  >
    <template #title-extra>
      <span
        class="inline-flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[12.5px] font-bold text-cat-auto-fg"
        style="background: var(--color-cat-auto-bg)"
      >
        <span class="ms text-base">directions_car</span>{{ vehicles.length }}
        {{ vehicles.length === 1 ? 'veicolo' : 'veicoli' }}
      </span>
    </template>
    <template #actions>
      <button
        class="inline-flex h-[42px] cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white shadow-[0_4px_12px_rgba(196,98,45,.28)] hover:bg-brand-dark"
        @click="openNew"
      >
        <span class="ms text-[20px]">add</span>Aggiungi veicolo
      </button>
    </template>
  </PageHeader>

  <main class="px-4 pb-11 pt-7 md:px-8">
    <div
      v-if="vehicles.length"
      class="grid items-start gap-[22px]"
      style="grid-template-columns: repeat(auto-fit, minmax(min(360px, 100%), 1fr))"
    >
      <section
        v-for="v in vehicles"
        :key="v.id"
        class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <div class="flex items-center gap-3.5 border-b border-line-soft bg-surface-alt px-[22px] py-5">
          <div
            class="flex h-12 w-12 flex-none items-center justify-center rounded-[13px] text-cat-auto-fg"
            style="background: var(--color-cat-auto-bg)"
          >
            <span class="ms text-[26px]">directions_car</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[17px] font-extrabold tracking-tight">
              {{ v.marca }} {{ v.modello }}
            </div>
            <div class="mt-0.5 text-[12.5px] font-semibold text-ink-mute">
              Immatricolata {{ v.anno }}
            </div>
          </div>
          <span
            class="rounded-lg border border-[#DCE4EE] bg-surface px-[11px] py-1.5 text-[13px] font-extrabold tracking-[1px] text-cat-auto-fg"
            >{{ v.targa }}</span
          >
        </div>

        <div
          v-if="nextExpiry(v.id)"
          class="flex items-center gap-2.5 border-b border-line-soft px-[22px] py-3 text-[12.5px] font-bold"
          :class="expiryTone[nextExpiry(v.id)!.tone]"
        >
          <span class="ms text-[19px]">schedule</span>
          Prossima scadenza: {{ nextExpiry(v.id)!.label }}
        </div>

        <div class="flex flex-col">
          <DocumentRow v-for="d in docsOf(v.id)" :key="d.id" :doc="d" show-visibility />
          <p
            v-if="!docsOf(v.id).length"
            class="m-0 px-[22px] py-6 text-center text-[12.5px] font-semibold text-ink-mute"
          >
            Nessun documento per questo veicolo.
          </p>
        </div>

        <div class="flex border-t border-line-soft">
          <button
            class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent py-3.5 text-[13px] font-bold text-ink-soft hover:bg-surface-alt"
            @click="openEdit(v)"
          >
            <span class="ms text-[18px]">edit</span>Modifica
          </button>
          <button
            class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-0 border-l border-line-soft bg-transparent py-3.5 text-[13px] font-bold text-danger hover:bg-surface-alt"
            @click="removeVehicle(v)"
          >
            <span class="ms text-[18px]">delete</span>Elimina
          </button>
        </div>
      </section>
    </div>

    <div
      v-else-if="!loading"
      class="flex flex-col items-center gap-2 rounded-[18px] border border-line bg-surface px-6 py-14 text-center"
    >
      <span class="ms text-[42px] text-ink-faint">directions_car</span>
      <p class="m-0 text-sm font-bold">Nessun veicolo</p>
      <p class="m-0 text-[12.5px] font-semibold text-ink-mute">
        Aggiungi un veicolo per raggruppare bolli, revisioni e assicurazioni.
      </p>
    </div>

    <!-- Documenti auto non associati ad alcun veicolo -->
    <section v-if="orphanDocs.length" class="mt-7">
      <h2 class="mb-3 text-[13px] font-extrabold tracking-tight text-ink-soft">
        Documenti auto senza veicolo
      </h2>
      <div
        class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <DocumentRow v-for="d in orphanDocs" :key="d.id" :doc="d" show-visibility />
      </div>
    </section>
  </main>

  <!-- Modal aggiungi/modifica veicolo -->
  <div
    v-if="showForm"
    class="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
    @click.self="showForm = false"
  >
    <form
      class="flex w-full max-w-[420px] flex-col gap-4 rounded-[18px] border border-line bg-surface p-6 shadow-xl"
      @submit.prevent="saveVehicle"
    >
      <h2 class="m-0 text-lg font-extrabold">
        {{ editingId ? 'Modifica veicolo' : 'Nuovo veicolo' }}
      </h2>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Marca</span>
          <input v-model="form.marca" required placeholder="Fiat" :class="inputClass" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Modello</span>
          <input v-model="form.modello" required placeholder="Panda" :class="inputClass" />
        </label>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Targa</span>
          <input v-model="form.targa" required placeholder="GA123BC" :class="inputClass" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Anno</span>
          <input v-model.number="form.anno" type="number" min="1900" max="2100" required :class="inputClass" />
        </label>
      </div>
      <p v-if="formError" class="m-0 text-[12.5px] font-bold text-danger">{{ formError }}</p>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="inline-flex h-[42px] items-center rounded-[11px] border border-line bg-surface px-[17px] text-[13.5px] font-bold text-ink-soft hover:bg-surface-alt"
          @click="showForm = false"
        >
          Annulla
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex h-[42px] cursor-pointer items-center rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {{ saving ? 'Salvataggio…' : 'Salva' }}
        </button>
      </div>
    </form>
  </div>
</template>
