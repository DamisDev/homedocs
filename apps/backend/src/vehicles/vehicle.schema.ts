import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

/** Veicolo dell'household, per raggruppare i documenti auto (sezione 3 della spec). */
@Schema({
  collection: 'vehicles',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Vehicle {
  @Prop({ type: Types.ObjectId, ref: 'Household', required: true, index: true })
  householdId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  targa: string;

  @Prop({ required: true, trim: true })
  marca: string;

  @Prop({ required: true, trim: true })
  modello: string;

  @Prop({ required: true })
  anno: number;

  createdAt: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
