<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DocumentDto } from '@homedocs/shared-types'
import { documentsApi } from '../api/documents'
import DocumentRow from '../components/DocumentRow.vue'
import PageHeader from '../components/PageHeader.vue'
import { useAuthStore } from '../stores/auth'
import { useCategories } from '../composables/useCategories'

const auth = useAuthStore()
const { load: loadCategories } = useCategories()

const scadenze = ref<DocumentDto[]>([])
const recenti = ref<DocumentDto[]>([])
const totals = ref({ tutti: 0, privati: 0, condivisi: 0 })
const loading = ref(true)

const today = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

const subtitle = computed(() => {
  const n = scadenze.value.length
  const cap = today.charAt(0).toUpperCase() + today.slice(1)
  return n > 0
    ? `${cap} · hai ${n} scadenz${n === 1 ? 'a' : 'e'} nei prossimi 30 giorni`
    : `${cap} · nessuna scadenza nei prossimi 30 giorni`
})

const stats = computed(() => [
  { icon: 'folder', bg: 'var(--color-brand-tint)', fg: 'var(--color-brand)', value: totals.value.tutti, label: 'Documenti visibili' },
  { icon: 'lock', bg: 'var(--color-cat-altro-bg)', fg: 'var(--color-cat-altro-fg)', value: totals.value.privati, label: 'Nel tuo spazio privato' },
  { icon: 'groups', bg: '#EFE9F8', fg: 'var(--color-accent-violet)', value: totals.value.condivisi, label: 'In bacheca familiare' },
])

onMounted(async () => {
  const in30 = new Date()
  in30.setDate(in30.getDate() + 30)
  const [exp, rec, priv, cond] = await Promise.all([
    documentsApi.list({ scadenzaEntro: in30.toISOString(), limit: 5 }),
    documentsApi.list({ limit: 5 }),
    documentsApi.list({ visibilita: 'privato', limit: 1 }),
    documentsApi.list({ visibilita: 'condiviso', limit: 1 }),
    loadCategories(),
  ])
  scadenze.value = exp.items
  recenti.value = rec.items
  totals.value = { tutti: rec.total, privati: priv.total, condivisi: cond.total }
  loading.value = false
})
</script>

<template>
  <PageHeader :title="`Ciao, ${auth.user?.nome}`" :subtitle="subtitle">
    <template #actions>
      <RouterLink
        :to="{ name: 'upload' }"
        class="inline-flex h-[42px] items-center gap-2 rounded-[11px] bg-brand px-[17px] text-[13.5px] font-bold text-white shadow-[0_4px_12px_rgba(196,98,45,.28)] hover:bg-brand-dark"
      >
        <span class="ms text-[20px]">add</span>Nuovo documento
      </RouterLink>
    </template>
  </PageHeader>

  <main class="flex flex-col gap-[26px] px-4 pb-11 pt-7 md:px-8">
    <div class="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="flex items-center gap-[15px] rounded-2xl border border-line bg-surface px-[19px] py-[17px] shadow-[0_1px_2px_rgba(43,38,34,.04)]"
      >
        <div
          class="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
          :style="{ background: s.bg }"
        >
          <span class="ms text-[23px]" :style="{ color: s.fg }">{{ s.icon }}</span>
        </div>
        <div>
          <div class="text-[25px] font-extrabold leading-none tracking-tight">{{ s.value }}</div>
          <div class="mt-[3px] text-[12.5px] font-semibold text-ink-mute">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-6">
      <section
        class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <div class="flex items-center gap-[11px] px-[22px] pb-[15px] pt-[19px]">
          <span class="ms text-[22px] text-brand">event_upcoming</span>
          <h2 class="m-0 flex-1 text-[16.5px] font-extrabold tracking-tight">Scadenze imminenti</h2>
          <span class="text-xs font-semibold text-ink-mute">prossimi 30 giorni</span>
        </div>
        <div v-if="scadenze.length" class="flex flex-col">
          <DocumentRow v-for="d in scadenze" :key="d.id" :doc="d" />
        </div>
        <p v-else-if="!loading" class="m-0 border-t border-line-soft px-[22px] py-6 text-[13px] font-semibold text-ink-mute">
          Nessuna scadenza nei prossimi 30 giorni 🎉
        </p>
      </section>

      <section
        class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
      >
        <div class="flex items-center gap-[11px] px-[22px] pb-[15px] pt-[19px]">
          <span class="ms text-[22px] text-brand">history</span>
          <h2 class="m-0 flex-1 text-[16.5px] font-extrabold tracking-tight">Documenti recenti</h2>
          <span class="text-xs font-semibold text-ink-mute">ultimi caricati</span>
        </div>
        <div v-if="recenti.length" class="flex flex-col">
          <DocumentRow v-for="d in recenti" :key="d.id" :doc="d" show-visibility />
        </div>
        <p v-else-if="!loading" class="m-0 border-t border-line-soft px-[22px] py-6 text-[13px] font-semibold text-ink-mute">
          Ancora nessun documento: carica il primo!
        </p>
      </section>
    </div>
  </main>
</template>
