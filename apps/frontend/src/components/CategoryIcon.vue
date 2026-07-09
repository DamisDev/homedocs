<script setup lang="ts">
import { computed } from 'vue'
import { useCategories } from '../composables/useCategories'
import { useCategoryStyle } from '../composables/useCategoryStyle'

const props = withDefaults(defineProps<{ categoria: string; size?: number }>(), { size: 40 })

const { categories } = useCategories()
const { styleOf } = useCategoryStyle(() => categories.value)

const style = computed(() => styleOf(props.categoria))
</script>

<template>
  <div
    class="flex flex-none items-center justify-center rounded-[11px]"
    :style="{ width: `${size}px`, height: `${size}px`, background: style.bg }"
  >
    <span class="ms" :style="{ fontSize: `${size * 0.52}px`, color: style.fg }">{{
      style.icon
    }}</span>
  </div>
</template>
