const FMT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(iso: string | null | undefined): string {
  return iso ? FMT.format(new Date(iso)) : '—'
}

/** Giorni (interi, arrotondati a mezzanotte) da oggi alla data. Negativo = passata. */
export function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Badge di urgenza scadenza coerente coi mockup. */
export function expiryBadge(iso: string | null | undefined): {
  label: string
  tone: 'danger' | 'warning' | 'success' | 'muted'
} | null {
  if (!iso) return null
  const days = daysUntil(iso)
  if (days < 0) return { label: 'Scaduto', tone: 'danger' }
  if (days === 0) return { label: 'Oggi', tone: 'danger' }
  if (days <= 7) return { label: `${days} g`, tone: 'danger' }
  if (days <= 30) return { label: `${days} giorni`, tone: 'warning' }
  return { label: formatDate(iso), tone: 'muted' }
}
