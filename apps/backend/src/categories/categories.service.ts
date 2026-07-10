import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type {
  DocumentCategoryDto,
  TipoCategoria,
} from '@homedocs/shared-types';
import {
  DocumentCategory,
  DocumentCategoryDocument,
} from './document-category.schema';

/** Categorie di partenza (sezione 3 della spec); restano modificabili in DB. */
const DEFAULT_CATEGORIES: Array<
  Pick<DocumentCategory, 'nome' | 'tipo' | 'templateCampi'>
> = [
  {
    nome: 'visita_medica',
    tipo: 'medico',
    templateCampi: ['dataDocumento', 'importo', 'struttura'],
  },
  {
    nome: 'referto',
    tipo: 'medico',
    templateCampi: ['dataDocumento', 'struttura'],
  },
  {
    nome: 'bolletta',
    tipo: 'casa',
    templateCampi: ['dataScadenza', 'importo', 'ente'],
  },
  {
    nome: 'contratto_casa',
    tipo: 'casa',
    templateCampi: ['dataScadenza', 'ente'],
  },
  {
    nome: 'assicurazione_casa',
    tipo: 'casa',
    templateCampi: ['dataScadenza', 'importo', 'compagnia'],
  },
  {
    nome: 'garanzia',
    tipo: 'casa',
    templateCampi: ['dataScadenza', 'negozio'],
  },
  {
    nome: 'bollo_auto',
    tipo: 'auto',
    templateCampi: ['dataScadenza', 'importo', 'targa'],
  },
  { nome: 'revisione', tipo: 'auto', templateCampi: ['dataScadenza', 'targa'] },
  {
    nome: 'assicurazione_auto',
    tipo: 'auto',
    templateCampi: ['dataScadenza', 'importo', 'targa', 'compagnia'],
  },
  {
    nome: 'multa',
    tipo: 'auto',
    templateCampi: ['dataScadenza', 'importo', 'targa'],
  },
  { nome: 'altro', tipo: 'altro', templateCampi: [] },
];

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectModel(DocumentCategory.name)
    private readonly categoryModel: Model<DocumentCategory>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.categoryModel
        .updateOne({ nome: cat.nome }, { $setOnInsert: cat }, { upsert: true })
        .exec();
    }
  }

  async findAll(): Promise<DocumentCategoryDto[]> {
    const categories = await this.categoryModel
      .find()
      .sort({ tipo: 1, nome: 1 })
      .exec();
    return categories.map((c) => this.toDto(c));
  }

  async existsBySlug(nome: string): Promise<boolean> {
    return (await this.categoryModel.exists({ nome }).exec()) !== null;
  }

  /** Slug delle categorie di un dato macro-tipo (es. tutte le categorie "auto"). */
  async slugsByTipo(tipo: TipoCategoria): Promise<string[]> {
    const categories = await this.categoryModel
      .find({ tipo })
      .select('nome')
      .exec();
    return categories.map((c) => c.nome);
  }

  private toDto(cat: DocumentCategoryDocument): DocumentCategoryDto {
    return {
      id: cat._id.toHexString(),
      nome: cat.nome,
      tipo: cat.tipo,
      templateCampi: cat.templateCampi,
    };
  }
}
