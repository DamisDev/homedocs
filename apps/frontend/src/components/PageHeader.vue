<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header
    class="sticky top-0 z-[5] flex flex-wrap items-center gap-5 border-b border-line bg-page/85 px-8 py-6 backdrop-blur"
  >
    <div class="min-w-[200px] flex-1">
      <div class="flex items-center gap-2.5">
        <h1 class="m-0 text-[23px] font-extrabold tracking-tight">{{ title }}</h1>
        <slot name="title-extra" />
      </div>
      <p v-if="subtitle" class="mb-0 mt-[5px] text-[13.5px] font-medium text-ink-mute">
        {{ subtitle }}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <slot name="actions" />
    </div>
  </header>
</template>
