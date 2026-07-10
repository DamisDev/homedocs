import type {
  HouseholdDto,
  HouseholdWithMembersDto,
} from '@homedocs/shared-types'
import { api } from './client'

export const householdsApi = {
  mine() {
    return api.get<HouseholdWithMembersDto>('/households/mine')
  },

  regenerateCode() {
    return api.post<HouseholdDto>('/households/regenerate-code')
  },
}
