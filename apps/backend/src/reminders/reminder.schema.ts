import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { StatoReminder, TipoNotifica } from '@homedocs/shared-types';

export type ReminderDocument = HydratedDocument<Reminder>;

/** Default della spec: notifica a 30, 15 e 7 giorni dalla scadenza. */
export const DEFAULT_GIORNI_ANTICIPO = [30, 15, 7];

@Schema({ collection: 'reminders', timestamps: true })
export class Reminder {
  @Prop({ type: Types.ObjectId, ref: 'HomeDoc', required: true, unique: true })
  documentId: Types.ObjectId;

  @Prop({ required: true, index: true })
  dataScadenza: Date;

  @Prop({ type: String, enum: ['email'], default: 'email' })
  tipoNotifica: TipoNotifica;

  @Prop({
    type: String,
    enum: ['attivo', 'inviato', 'scaduto'],
    default: 'attivo',
  })
  stato: StatoReminder;

  @Prop({ type: [Number], default: DEFAULT_GIORNI_ANTICIPO })
  giorniAnticipoNotifica: number[];

  /** Soglie (giorni di anticipo) già notificate, per non inviare doppioni. */
  @Prop({ type: [Number], default: [] })
  notificheInviate: number[];
}

export const ReminderSchema = SchemaFactory.createForClass(Reminder);
