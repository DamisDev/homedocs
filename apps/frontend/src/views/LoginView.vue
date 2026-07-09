<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    await router.push((route.query.redirect as string) ?? { name: 'dashboard' })
  } catch (e) {
    error.value = e instanceof ApiError && e.status === 401 ? 'Credenziali non valide' : 'Errore di connessione'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-[400px]">
      <div class="mb-7 flex items-center justify-center gap-3">
        <div
          class="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-brand shadow-[0_4px_10px_rgba(196,98,45,.28)]"
        >
          <span class="ms text-[26px] text-white">home_storage</span>
        </div>
        <div>
          <div class="text-xl font-extrabold tracking-tight">HomeDocs</div>
          <div class="text-xs font-semibold text-ink-mute">Documenti di casa</div>
        </div>
      </div>

      <form
        class="flex flex-col gap-4 rounded-[18px] border border-line bg-surface p-7 shadow-[0_1px_3px_rgba(43,38,34,.05)]"
        @submit.prevent="onSubmit"
      >
        <h1 class="m-0 text-lg font-extrabold">Accedi</h1>

        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Email</span>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand"
          />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Password</span>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand"
          />
        </label>

        <p v-if="error" class="m-0 text-[12.5px] font-bold text-danger">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="h-[42px] cursor-pointer rounded-[11px] border-0 bg-brand text-[13.5px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {{ loading ? 'Accesso…' : 'Accedi' }}
        </button>

        <p class="m-0 text-center text-[12.5px] font-semibold text-ink-mute">
          Non hai un account?
          <RouterLink :to="{ name: 'register' }" class="font-bold text-brand hover:text-brand-dark"
            >Registrati</RouterLink
          >
        </p>
      </form>
    </div>
  </div>
</template>
