import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HouseholdDocument = HydratedDocument<Household>;

@Schema({
  collection: 'households',
  timestamps: { createdAt: true, updatedAt: false },
})
export class Household {
  @Prop({ required: true, trim: true })
  nome: string;

  createdAt: Date;
}

export const HouseholdSchema = SchemaFactory.createForClass(Household);
