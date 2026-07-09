import type { AuthResponseDto } from '@homedocs/shared-types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const ACCESS_KEY = 'homedocs.accessToken'
const REFRESH_KEY = 'homedocs.refreshToken'

export function getTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Chiamato quando anche il refresh fallisce: impostato dallo store auth (logout). */
let onSessionExpired: (() => void) | null = null
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  // una sola refresh in volo anche con richieste concorrenti
  refreshing ??= (async () => {
    const { refreshToken } = getTokens()
    if (!refreshToken) return false
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as AuthResponseDto
    setTokens(data)
    return true
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** FormData per upload multipart (niente Content-Type manuale) */
  formData?: FormData
  auth?: boolean
  query?: Record<string, string | number | undefined>
}

async function request<T>(path: string, options: RequestOptions = {}, retry = true): Promise<T> {
  const { method = 'GET', body, formData, auth = true, query } = options

  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v))
  }

  const headers: Record<string, string> = {}
  if (auth) {
    const { accessToken } = getTokens()
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  })

  if (res.status === 401 && auth && retry) {
    if (await tryRefresh()) return request<T>(path, options, false)
    onSessionExpired?.()
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const data = (await res.json()) as { message?: string | string[] }
      message = Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? message)
    } catch {
      /* corpo non JSON */
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, opts: Partial<RequestOptions> = {}) =>
    request<T>(path, { method: 'POST', body, ...opts }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', formData }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
