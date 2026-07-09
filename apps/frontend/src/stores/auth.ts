import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from '@homedocs/shared-types'
import { api, clearTokens, getTokens, setSessionExpiredHandler, setTokens } from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function applyAuth(res: AuthResponseDto) {
    setTokens(res)
    user.value = res.user
  }

  async function login(dto: LoginRequestDto) {
    applyAuth(await api.post<AuthResponseDto>('/auth/login', dto, { auth: false }))
  }

  async function register(dto: RegisterRequestDto) {
    applyAuth(await api.post<AuthResponseDto>('/auth/register', dto, { auth: false }))
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      /* logout best-effort */
    }
    clearTokens()
    user.value = null
  }

  /** Ripristina la sessione al load (token in localStorage). */
  async function restore() {
    if (getTokens().accessToken) {
      try {
        user.value = await api.get<UserDto>('/auth/me')
      } catch {
        clearTokens()
      }
    }
    ready.value = true
  }

  setSessionExpiredHandler(() => {
    clearTokens()
    user.value = null
  })

  return { user, ready, isAuthenticated, login, register, logout, restore }
})
