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

  /** Codice invito persistente e univoco: chi lo conosce può entrare in questo household. */
  @Prop({ required: true, unique: true })
  codiceInvito: string;

  createdAt: Date;
}

export const HouseholdSchema = SchemaFactory.createForClass(Household);
