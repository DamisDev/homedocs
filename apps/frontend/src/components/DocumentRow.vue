<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentDto } from '@homedocs/shared-types'
import { useCategories } from '../composables/useCategories'
import { useCategoryStyle } from '../composables/useCategoryStyle'
import { expiryBadge, formatDate } from '../utils/dates'
import CategoryIcon from './CategoryIcon.vue'
import VisibilityBadge from './VisibilityBadge.vue'

const props = defineProps<{ doc: DocumentDto; showVisibility?: boolean }>()

const { categories } = useCategories()
const { labelOf } = useCategoryStyle(() => categories.value)

const badge = computed(() => expiryBadge(props.doc.dataScadenza))

const toneClasses: Record<string, string> = {
  danger: 'bg-[#FCE9E9] text-danger',
  warning: 'bg-[#F7EDDA] text-warning',
  success: 'bg-[#E7F3EA] text-success',
  muted: 'bg-surface-alt text-ink-soft',
}
</script>

<template>
  <RouterLink
    :to="{ name: 'documento', params: { id: doc.id } }"
    class="flex cursor-pointer items-center gap-3.5 border-t border-line-soft px-5 py-3.5 text-inherit hover:bg-surface-alt"
  >
    <CategoryIcon :categoria="doc.categoria" />
    <div class="min-w-0 flex-1">
      <div class="truncate text-sm font-bold">{{ doc.titolo }}</div>
      <div class="mt-0.5 text-xs font-semibold text-ink-mute">
        {{ labelOf(doc.categoria) }} · {{ formatDate(doc.dataDocumento) }}
        <template v-if="doc.dataScadenza"> · scade il {{ formatDate(doc.dataScadenza) }}</template>
      </div>
    </div>
    <span
      v-if="badge"
      class="flex-none rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
      :class="toneClasses[badge.tone]"
      >{{ badge.label }}</span
    >
    <VisibilityBadge v-if="showVisibility" :visibilita="doc.visibilita" />
  </RouterLink>
</template>
