<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { DocumentDto } from '@homedocs/shared-types'
import { documentsApi } from '../api/documents'
import DocumentRow from '../components/DocumentRow.vue'
import PageHeader from '../components/PageHeader.vue'
import { useCategories } from '../composables/useCategories'

const { load: loadCategories } = useCategories()

const docs = ref<DocumentDto[]>([])
const total = ref(0)
const loading = ref(true)

onMounted(async () => {
  const [res] = await Promise.all([
    documentsApi.list({ visibilita: 'condiviso', limit: 50 }),
    loadCategories(),
  ])
  docs.value = res.items
  total.value = res.total
  loading.value = false
})
</script>

<template>
  <PageHeader
    title="Bacheca familiare"
    :subtitle="`${total} document${total === 1 ? 'o condiviso' : 'i condivisi'} dalla famiglia`"
  >
    <template #title-extra>
      <span
        class="inline-flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[12.5px] font-bold"
        style="background: #efe9f8; color: var(--color-accent-violet)"
      >
        <span class="ms text-base">groups</span>Condivisi
      </span>
    </template>
  </PageHeader>

  <main class="px-8 pb-11 pt-7">
    <section
      class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
    >
      <div v-if="docs.length" class="flex flex-col">
        <DocumentRow v-for="d in docs" :key="d.id" :doc="d" />
      </div>
      <div v-else-if="!loading" class="flex flex-col items-center gap-2 px-6 py-14 text-center">
        <span class="ms text-[42px] text-ink-faint">groups</span>
        <p class="m-0 text-sm font-bold">La bacheca è vuota</p>
        <p class="m-0 text-[12.5px] font-semibold text-ink-mute">
          Quando un membro della famiglia condivide un documento, appare qui per tutti.
        </p>
      </div>
    </section>
  </main>
</template>
