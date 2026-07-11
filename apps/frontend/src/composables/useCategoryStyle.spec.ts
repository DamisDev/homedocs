import { describe, expect, it } from 'vitest'
import type { DocumentCategoryDto } from '@homedocs/shared-types'
import { useCategoryStyle } from './useCategoryStyle'

const categories: DocumentCategoryDto[] = [
  { id: '1', nome: 'bollo_auto', tipo: 'auto', templateCampi: ['dataScadenza', 'importo', 'targa'] },
  { id: '2', nome: 'visita_medica', tipo: 'medico', templateCampi: ['dataDocumento', 'importo', 'struttura'] },
]

describe('useCategoryStyle', () => {
  const { tipoOf, styleOf, labelOf } = useCategoryStyle(() => categories)

  it('tipoOf risolve il tipo dalla categoria nota', () => {
    expect(tipoOf('bollo_auto')).toBe('auto')
    expect(tipoOf('visita_medica')).toBe('medico')
  })

  it('tipoOf ricade su "altro" per uno slug sconosciuto', () => {
    expect(tipoOf('categoria_inesistente')).toBe('altro')
  })

  it('styleOf usa l\'icona specifica dello slug quando presente', () => {
    expect(styleOf('bollo_auto').icon).toBe('toll')
  })

  it('styleOf ricade sull\'icona di base del tipo se lo slug non ha un\'icona dedicata', () => {
    const style = styleOf('categoria_inesistente')
    expect(style.icon).toBe('description') // icona di base di "altro"
  })

  it('labelOf converte lo slug in etichetta leggibile', () => {
    expect(labelOf('visita_medica')).toBe('Visita medica')
    expect(labelOf('bollo_auto')).toBe('Bollo auto')
  })
})
