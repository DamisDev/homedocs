<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { HouseholdWithMembersDto } from '@homedocs/shared-types'
import { householdsApi } from '../api/households'
import PageHeader from '../components/PageHeader.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const household = ref<HouseholdWithMembersDto | null>(null)
const loading = ref(true)
const copied = ref(false)
const regenerating = ref(false)

function initials(nome: string, cognome: string) {
  return `${nome[0] ?? ''}${cognome[0] ?? ''}`.toUpperCase()
}

async function copyCode() {
  if (!household.value) return
  try {
    await navigator.clipboard.writeText(household.value.codiceInvito)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard non disponibile */
  }
}

async function regenerate() {
  if (!household.value) return
  if (!confirm('Rigenerare il codice? Quello attuale smetterà di funzionare.')) return
  regenerating.value = true
  try {
    const updated = await householdsApi.regenerateCode()
    household.value = { ...household.value, codiceInvito: updated.codiceInvito }
  } finally {
    regenerating.value = false
  }
}

onMounted(async () => {
  household.value = await householdsApi.mine()
  loading.value = false
})
</script>

<template>
  <PageHeader
    :title="household?.nome ?? 'La mia famiglia'"
    subtitle="Membri del nucleo familiare e invito"
  >
    <template #title-extra>
      <span
        class="inline-flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[12.5px] font-bold"
        style="background: #efe9f8; color: var(--color-accent-violet)"
      >
        <span class="ms text-base">groups</span>{{ household?.membri.length ?? 0 }}
        {{ (household?.membri.length ?? 0) === 1 ? 'membro' : 'membri' }}
      </span>
    </template>
  </PageHeader>

  <main class="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-11 pt-7 md:px-8">
    <!-- Codice invito -->
    <section
      class="rounded-[18px] border border-line bg-surface p-6 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
    >
      <div class="flex items-center gap-2.5">
        <span class="ms text-[22px] text-brand">key</span>
        <h2 class="m-0 text-[15px] font-extrabold">Invita un familiare</h2>
      </div>
      <p class="mb-4 mt-1.5 text-[12.5px] font-semibold text-ink-mute">
        Condividi questo codice: chi si registra inserendolo entrerà in questa famiglia.
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <code
          class="flex-1 rounded-[11px] border border-dashed border-line bg-surface-alt px-4 py-3 text-center text-[22px] font-extrabold tracking-[4px] text-ink"
          >{{ household?.codiceInvito ?? '········' }}</code
        >
        <button
          class="inline-flex h-[46px] cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-brand px-[17px] text-[13.5px] font-bold text-white hover:bg-brand-dark"
          @click="copyCode"
        >
          <span class="ms text-[19px]">{{ copied ? 'check' : 'content_copy' }}</span>
          {{ copied ? 'Copiato' : 'Copia' }}
        </button>
      </div>
      <button
        v-if="auth.user?.ruolo === 'admin'"
        class="mt-3 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[12.5px] font-bold text-ink-soft hover:text-brand disabled:opacity-60"
        :disabled="regenerating"
        @click="regenerate"
      >
        <span class="ms text-[17px]">autorenew</span>
        {{ regenerating ? 'Rigenerazione…' : 'Rigenera codice' }}
      </button>
      <p v-else class="mt-3 text-[11.5px] font-semibold text-ink-mute">
        Solo l'amministratore può rigenerare il codice invito.
      </p>
    </section>

    <!-- Membri -->
    <section
      class="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_1px_3px_rgba(43,38,34,.05)]"
    >
      <div class="border-b border-line-soft px-5 py-4">
        <h2 class="m-0 text-[15px] font-extrabold">Membri</h2>
      </div>
      <div
        v-for="m in household?.membri ?? []"
        :key="m.id"
        class="flex items-center gap-3.5 border-t border-line-soft px-5 py-3.5 first:border-t-0"
      >
        <div
          class="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#EADFD3] text-[14px] font-bold text-[#8A6A4D]"
        >
          {{ initials(m.nome, m.cognome) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-bold">
            {{ m.nome }} {{ m.cognome }}
            <span v-if="m.id === auth.user?.id" class="text-[12px] font-semibold text-ink-mute"
              >(tu)</span
            >
          </div>
          <div class="truncate text-xs font-semibold text-ink-mute">{{ m.email }}</div>
        </div>
        <span
          class="flex-none rounded-lg px-2.5 py-1 text-[11.5px] font-bold"
          :class="
            m.ruolo === 'admin' ? 'bg-brand-tint text-brand' : 'bg-surface-alt text-ink-soft'
          "
          >{{ m.ruolo === 'admin' ? 'Amministratore' : 'Membro' }}</span
        >
      </div>
    </section>
  </main>
</template>
