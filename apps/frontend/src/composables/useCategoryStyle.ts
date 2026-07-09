import type { DocumentCategoryDto, TipoCategoria } from '@homedocs/shared-types'

/**
 * Mappatura tipo categoria → stile (colori dai design token, icona Material).
 * Centralizzata qui come richiesto dalla spec (sezione 3ter): mai hardcodare
 * questi valori nei componenti.
 */
const STYLE_BY_TIPO: Record<TipoCategoria, { bg: string; fg: string; icon: string }> = {
  medico: { bg: 'var(--color-cat-medico-bg)', fg: 'var(--color-cat-medico-fg)', icon: 'medical_services' },
  casa: { bg: 'var(--color-cat-casa-bg)', fg: 'var(--color-cat-casa-fg)', icon: 'home' },
  auto: { bg: 'var(--color-cat-auto-bg)', fg: 'var(--color-cat-auto-fg)', icon: 'directions_car' },
  altro: { bg: 'var(--color-cat-altro-bg)', fg: 'var(--color-cat-altro-fg)', icon: 'description' },
}

const ICON_BY_SLUG: Record<string, string> = {
  visita_medica: 'stethoscope',
  referto: 'clinical_notes',
  bolletta: 'receipt_long',
  contratto_casa: 'contract',
  assicurazione_casa: 'shield_with_house',
  garanzia: 'verified_user',
  bollo_auto: 'toll',
  revisione: 'build',
  assicurazione_auto: 'car_crash',
  multa: 'gavel',
}

export function useCategoryStyle(categories: () => DocumentCategoryDto[]) {
  function tipoOf(slug: string): TipoCategoria {
    return categories().find((c) => c.nome === slug)?.tipo ?? 'altro'
  }

  function styleOf(slug: string) {
    const base = STYLE_BY_TIPO[tipoOf(slug)]
    return { ...base, icon: ICON_BY_SLUG[slug] ?? base.icon }
  }

  /** Etichetta leggibile: "visita_medica" → "Visita medica". */
  function labelOf(slug: string): string {
    const s = slug.replaceAll('_', ' ')
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  return { tipoOf, styleOf, labelOf }
}
