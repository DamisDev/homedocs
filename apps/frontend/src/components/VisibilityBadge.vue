<script setup lang="ts">
import type { Visibilita } from '@homedocs/shared-types'

defineProps<{ visibilita: Visibilita }>()
</script>

<template>
  <!-- Regola privacy UI: il privato deve essere sempre riconoscibile a colpo d'occhio -->
  <span
    v-if="visibilita === 'privato'"
    class="inline-flex flex-none items-center gap-[5px] rounded-[20px] bg-surface-alt px-2.5 py-[5px] text-[11.5px] font-bold text-ink-soft"
    title="Solo tu lo vedi"
  >
    <span class="ms text-[15px]">lock</span>Solo tu
  </span>
  <span
    v-else
    class="inline-flex flex-none items-center gap-[5px] rounded-[20px] px-2.5 py-[5px] text-[11.5px] font-bold"
    style="background: #efe9f8; color: var(--color-accent-violet)"
    title="Visibile a tutta la famiglia"
  >
    <span class="ms text-[15px]">groups</span>Condiviso
  </span>
</template>
