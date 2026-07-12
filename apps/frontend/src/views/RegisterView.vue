<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const mode = ref<'crea' | 'entra'>('crea')
const form = ref({
  nome: '',
  cognome: '',
  email: '',
  password: '',
  nomeHousehold: '',
  codiceInvito: '',
})
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    // Il backend accetta esattamente uno tra nomeHousehold e codiceInvito.
    await auth.register({
      nome: form.value.nome,
      cognome: form.value.cognome,
      email: form.value.email,
      password: form.value.password,
      ...(mode.value === 'crea'
        ? { nomeHousehold: form.value.nomeHousehold }
        : { codiceInvito: form.value.codiceInvito.trim().toUpperCase() }),
    })
    await router.push({ name: 'dashboard' })
  } catch (e) {
    error.value =
      e instanceof ApiError
        ? e.status === 409
          ? 'Email già registrata'
          : e.message
        : 'Errore di connessione'
  } finally {
    loading.value = false
  }
}

const inputClass =
  'h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] outline-none focus:border-brand'
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-[440px]">
      <div class="mb-7 flex items-center justify-center gap-3">
        <div
          class="h-[46px] w-[46px] overflow-hidden rounded-[13px] shadow-[0_4px_10px_rgba(196,98,45,.28)]"
        >
          <img src="/logo.png" alt="HomeDocs" class="h-full w-full object-cover" />
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
        <h1 class="m-0 text-lg font-extrabold">Crea il tuo account</h1>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft">Nome</span>
            <input v-model="form.nome" required :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft">Cognome</span>
            <input v-model="form.cognome" required :class="inputClass" />
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Email</span>
          <input v-model="form.email" type="email" required autocomplete="email" :class="inputClass" />
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-[12.5px] font-bold text-ink-soft">Password</span>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            :class="inputClass"
          />
          <span class="text-[11px] font-semibold text-ink-mute">Minimo 8 caratteri</span>
        </label>
        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-1 rounded-[11px] bg-surface-alt p-1">
            <button
              type="button"
              class="h-[34px] rounded-lg text-[12.5px] font-bold transition-colors"
              :class="mode === 'crea' ? 'bg-surface text-brand shadow-sm' : 'text-ink-mute'"
              @click="mode = 'crea'"
            >
              Crea una famiglia
            </button>
            <button
              type="button"
              class="h-[34px] rounded-lg text-[12.5px] font-bold transition-colors"
              :class="mode === 'entra' ? 'bg-surface text-brand shadow-sm' : 'text-ink-mute'"
              @click="mode = 'entra'"
            >
              Entra con codice
            </button>
          </div>

          <label v-if="mode === 'crea'" class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft">Nome della famiglia</span>
            <input
              v-model="form.nomeHousehold"
              required
              placeholder="es. Famiglia Rossi"
              :class="inputClass"
            />
            <span class="text-[11px] font-semibold text-ink-mute"
              >Creerai un nuovo nucleo familiare di cui sarai amministratore</span
            >
          </label>

          <label v-else class="flex flex-col gap-1.5">
            <span class="text-[12.5px] font-bold text-ink-soft">Codice invito</span>
            <input
              v-model="form.codiceInvito"
              required
              placeholder="es. GA123BCD"
              class="h-[42px] rounded-[11px] border border-line bg-surface px-3.5 text-[13.5px] font-bold uppercase tracking-[3px] outline-none focus:border-brand"
            />
            <span class="text-[11px] font-semibold text-ink-mute"
              >Entrerai nella famiglia come membro. Chiedi il codice a chi ti ha invitato.</span
            >
          </label>
        </div>

        <p v-if="error" class="m-0 text-[12.5px] font-bold text-danger">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="h-[42px] cursor-pointer rounded-[11px] border-0 bg-brand text-[13.5px] font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {{ loading ? 'Creazione…' : 'Registrati' }}
        </button>

        <p class="m-0 text-center text-[12.5px] font-semibold text-ink-mute">
          Hai già un account?
          <RouterLink :to="{ name: 'login' }" class="font-bold text-brand hover:text-brand-dark"
            >Accedi</RouterLink
          >
        </p>
      </form>
    </div>
  </div>
</template>
