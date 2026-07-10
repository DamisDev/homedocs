import type {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleDto,
} from '@homedocs/shared-types'
import { api } from './client'

export const vehiclesApi = {
  list() {
    return api.get<VehicleDto[]>('/vehicles')
  },

  get(id: string) {
    return api.get<VehicleDto>(`/vehicles/${id}`)
  },

  create(body: CreateVehicleDto) {
    return api.post<VehicleDto>('/vehicles', body)
  },

  update(id: string, body: UpdateVehicleDto) {
    return api.patch<VehicleDto>(`/vehicles/${id}`, body)
  },

  remove(id: string) {
    return api.delete<void>(`/vehicles/${id}`)
  },
}
