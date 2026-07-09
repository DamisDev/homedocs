import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { RuoloUtente } from '@homedocs/shared-types';

export type UserDocument = HydratedDocument<User>;

@Schema({
  collection: 'users',
  timestamps: { createdAt: true, updatedAt: false },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  nome: string;

  @Prop({ required: true })
  cognome: string;

  @Prop({ type: Types.ObjectId, ref: 'Household', required: true })
  householdId: Types.ObjectId;

  @Prop({ type: String, enum: ['admin', 'membro'], default: 'membro' })
  ruolo: RuoloUtente;

  /** Hash bcrypt del refresh token corrente; null se l'utente non ha sessioni attive. */
  @Prop({ type: String, default: null })
  refreshTokenHash: string | null;

  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
