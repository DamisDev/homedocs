import { ref } from 'vue'
import type { DocumentCategoryDto } from '@homedocs/shared-types'
import { documentsApi } from '../api/documents'

const categories = ref<DocumentCategoryDto[]>([])
let loaded = false

/** Cache condivisa delle categorie (cambiano raramente). */
export function useCategories() {
  async function load() {
    if (!loaded) {
      categories.value = await documentsApi.categories()
      loaded = true
    }
  }
  return { categories, load }
}
