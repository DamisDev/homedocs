import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { TipoCategoria } from '@homedocs/shared-types';

export type DocumentCategoryDocument = HydratedDocument<DocumentCategory>;

@Schema({ collection: 'documentCategories' })
export class DocumentCategory {
  /** Slug usato come `documents.categoria`, es. "visita_medica". */
  @Prop({ required: true, unique: true })
  nome: string;

  @Prop({
    type: String,
    enum: ['medico', 'casa', 'auto', 'altro'],
    required: true,
  })
  tipo: TipoCategoria;

  @Prop({ type: [String], default: [] })
  templateCampi: string[];
}

export const DocumentCategorySchema =
  SchemaFactory.createForClass(DocumentCategory);
