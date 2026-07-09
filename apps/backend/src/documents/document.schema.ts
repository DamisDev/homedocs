import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { StatoOcr, Visibilita } from '@homedocs/shared-types';

export type HomeDocDocument = HydratedDocument<HomeDoc>;

@Schema({ _id: false })
class Pagamento {
  @Prop({ required: true })
  importo: number;

  @Prop({ default: 'EUR' })
  valuta: string;

  @Prop({ required: true })
  metodoPagamento: string;

  @Prop({ required: true })
  dataPagamento: Date;

  @Prop()
  ricevutaUrl?: string;
}

const PagamentoSchema = SchemaFactory.createForClass(Pagamento);

/** "HomeDoc" per non collidere col tipo `Document` di Mongoose. Collection: documents. */
@Schema({ collection: 'documents', timestamps: true })
export class HomeDoc {
  @Prop({ type: Types.ObjectId, ref: 'Household', required: true, index: true })
  householdId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  @Prop({ required: true })
  categoria: string;

  @Prop({ required: true, trim: true })
  titolo: string;

  @Prop()
  descrizione?: string;

  /** Object key su MinIO (non un URL: quello firmato si genera on demand). */
  @Prop({ required: true })
  fileKey: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  dataDocumento: Date;

  @Prop({ type: Date, default: null })
  dataScadenza: Date | null;

  /** Privacy by default: nasce sempre privato (sezione 3bis della spec). */
  @Prop({ type: String, enum: ['privato', 'condiviso'], default: 'privato' })
  visibilita: Visibilita;

  @Prop({ type: Object, default: {} })
  datiEstratti: Record<string, unknown>;

  @Prop({
    type: String,
    enum: ['pending', 'completato', 'errore'],
    default: 'pending',
  })
  statoOcr: StatoOcr;

  @Prop({ type: PagamentoSchema, default: null })
  pagamento: Pagamento | null;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', default: null })
  vehicleId: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const HomeDocSchema = SchemaFactory.createForClass(HomeDoc);
HomeDocSchema.index({ householdId: 1, visibilita: 1, dataScadenza: 1 });
