<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { DocumentDto } from '@homedocs/shared-types'
import { documentsApi } from '../api/documents'
import DocumentRow from '../components/DocumentRow.vue'
import PageHeader from '../components/PageHeader.vue'
import { useCategories } from '../composables/useCategories'

const { load: loadCategories } = useCategories()

const docs = ref<DocumentDto[]>([])
const total = ref(0)
const search = ref('')
const loading = ref(true)

async function fetchDocs() {
  loading.value = true
  const res = await documentsApi.list({
    visibilita: 'privato',
    search: search.value || undefined,
    limit: 50,
  })
  docs.value = res.items
  total.value = res.total
  loading.value = false
}

let debounce: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(debounce)
  debounce = setTimeout(fetchDocs, 300)
})

onMounted(async () => {
  await Promise.all([fetchDocs(), loadCategories()])
})
</script>

<template>
  <PageHeader
    title="Spazio privato"
    :subtitle="`${total} document${total === 1 ? 'o' : 'i'} visibili solo a te`"
  >
    <template #title-extra>
      <span
        class="inline-flex items-center gap-1.5 rounded-[20px] bg-surface-alt px-[11px] py-[5px] text-[12.5px] font-bold text-ink-soft"
      >
        <span class="ms text-base">lock</span>Solo tu
      </span>
    </template>
    <template #actions>
      <div
        class="flex h-[42px] w-[230px] items-center gap-[9px] rounded-[11px] border border-line bg-surface px-3"
      >
        <span class="ms text-[20px] text-ink-faint">search</span>
        <input
          v-model="search"
          placeholder="Cerca nei tuoi documenti…"
          class="w-full border-0 bg-transparent text-[13.5px] outline-none"
        />
      </div>
    </template>
  </PageHeader>

  <main class="px-4 pb-11 pt-7 md:px-8">
    <section
      class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
    >
      <div v-if="docs.length" class="flex flex-col">
        <DocumentRow v-for="d in docs" :key="d.id" :doc="d" />
      </div>
      <div v-else-if="!loading" class="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span class="ms text-[42px] text-ink-faint">lock</span>
        <p class="m-0 text-sm font-bold">Nessun documento privato</p>
        <p class="m-0 text-[12.5px] font-semibold text-ink-mute">
          I documenti che carichi nascono qui, visibili solo a te.
        </p>
      </div>
    </section>
  </main>
</template>
