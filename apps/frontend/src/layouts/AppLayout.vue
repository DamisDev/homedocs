<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const u = auth.user
  return u ? `${u.nome[0] ?? ''}${u.cognome[0] ?? ''}`.toUpperCase() : ''
})

const navItems = [
  { name: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
  { name: 'privato', label: 'Spazio privato', icon: 'lock' },
  { name: 'bacheca', label: 'Bacheca familiare', icon: 'groups' },
  { name: 'auto', label: 'Documenti auto', icon: 'directions_car' },
  { name: 'famiglia', label: 'La mia famiglia', icon: 'diversity_3' },
]

async function onLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside
      class="sticky top-0 flex h-screen w-[264px] flex-none flex-col border-r border-line bg-surface px-4 py-[22px]"
    >
      <div class="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div
          class="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-brand shadow-[0_4px_10px_rgba(196,98,45,.28)]"
        >
          <span class="ms text-[22px] text-white">home_storage</span>
        </div>
        <div>
          <div class="text-base font-extrabold tracking-tight">HomeDocs</div>
          <div class="text-[11px] font-semibold text-ink-mute">Documenti di casa</div>
        </div>
      </div>

      <div class="px-2.5 pb-2 text-[10.5px] font-bold tracking-[.9px] text-ink-faint">MENU</div>
      <nav class="flex flex-col gap-[3px]">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-alt"
          exact-active-class="!bg-brand-tint !font-bold !text-brand"
        >
          <span class="ms text-[21px]">{{ item.icon }}</span>
          <span class="flex-1">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <RouterLink
        :to="{ name: 'upload' }"
        class="mt-5 inline-flex h-[42px] items-center justify-center gap-2 rounded-[11px] bg-brand text-[13.5px] font-bold text-white shadow-[0_4px_12px_rgba(196,98,45,.28)] hover:bg-brand-dark"
      >
        <span class="ms text-[20px]">add</span>Nuovo documento
      </RouterLink>

      <div class="mt-auto border-t border-line-soft pt-[18px]">
        <div class="flex items-center gap-[11px] rounded-xl p-2">
          <div
            class="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#EADFD3] text-[15px] font-bold text-[#8A6A4D]"
          >
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13.5px] font-bold">
              {{ auth.user?.nome }} {{ auth.user?.cognome }}
            </div>
            <div class="text-[11.5px] font-semibold text-ink-mute">
              {{ auth.user?.ruolo === 'admin' ? 'Amministratore' : 'Membro' }}
            </div>
          </div>
          <button
            class="cursor-pointer border-0 bg-transparent p-1"
            title="Esci"
            @click="onLogout"
          >
            <span class="ms text-[20px] text-ink-faint hover:text-danger">logout</span>
          </button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <RouterView />
    </div>
  </div>
</template>
