import type { EntityId } from './common';

/** Veicolo dell'household, per raggruppare i documenti auto. */
export interface VehicleDto {
  id: EntityId;
  householdId: EntityId;
  targa: string;
  marca: string;
  modello: string;
  anno: number;
}

export interface CreateVehicleDto {
  targa: string;
  marca: string;
  modello: string;
  anno: number;
}

export type UpdateVehicleDto = Partial<CreateVehicleDto>;
