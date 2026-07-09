import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import type {
  DocumentDto,
  PaginatedDto,
  Visibilita,
} from '@homedocs/shared-types';
import { CategoriesService } from '../categories/categories.service';
import { OcrService } from '../ocr/ocr.service';
import { RemindersService } from '../reminders/reminders.service';
import { StorageService } from '../storage/storage.service';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { HomeDoc, HomeDocDocument } from './document.schema';
import { CreateDocumentInputDto } from './dto/create-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents.dto';
import { UpdateDocumentInputDto } from './dto/update-document.dto';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(HomeDoc.name) private readonly docModel: Model<HomeDoc>,
    private readonly storageService: StorageService,
    private readonly categoriesService: CategoriesService,
    private readonly ocrService: OcrService,
    private readonly remindersService: RemindersService,
  ) {}

  /**
   * REGOLA NON NEGOZIABILE (sezione 3bis della spec): questo è l'UNICO punto
   * in cui si costruisce il filtro di visibilità. Ogni lettura di documenti
   * DEVE passare da qui — mai riscrivere questa condizione altrove.
   *
   *   uploadedBy === currentUserId
   *   OR (householdId === currentUserHouseholdId AND visibilita === "condiviso")
   */
  private visibilityFilter(user: AuthenticatedUser): QueryFilter<HomeDoc> {
    return {
      $or: [
        { uploadedBy: new Types.ObjectId(user.userId) },
        {
          householdId: new Types.ObjectId(user.householdId),
          visibilita: 'condiviso',
        },
      ],
    };
  }

  /** Lettura singola già autorizzata: 404 anche per i documenti privati altrui. */
  private async findVisibleOrThrow(
    user: AuthenticatedUser,
    id: string,
  ): Promise<HomeDocDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Documento non trovato');
    }
    const doc = await this.docModel
      .findOne({ _id: new Types.ObjectId(id), ...this.visibilityFilter(user) })
      .exec();
    if (!doc) {
      throw new NotFoundException('Documento non trovato');
    }
    return doc;
  }

  /** Come sopra, ma richiede anche di esserne il proprietario (modifiche). */
  private async findOwnedOrThrow(
    user: AuthenticatedUser,
    id: string,
  ): Promise<HomeDocDocument> {
    const doc = await this.findVisibleOrThrow(user, id);
    if (!doc.uploadedBy.equals(user.userId)) {
      throw new ForbiddenException(
        'Solo chi ha caricato il documento può modificarlo',
      );
    }
    return doc;
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateDocumentInputDto,
    file: Express.Multer.File,
  ): Promise<DocumentDto> {
    if (!(await this.categoriesService.existsBySlug(dto.categoria))) {
      throw new BadRequestException(`Categoria "${dto.categoria}" inesistente`);
    }

    const fileKey = await this.storageService.upload(
      user.householdId,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const doc = await this.docModel.create({
      householdId: new Types.ObjectId(user.householdId),
      uploadedBy: new Types.ObjectId(user.userId),
      categoria: dto.categoria,
      titolo: dto.titolo,
      descrizione: dto.descrizione,
      fileKey,
      fileType: file.mimetype,
      dataDocumento: new Date(dto.dataDocumento),
      dataScadenza: dto.dataScadenza ? new Date(dto.dataScadenza) : null,
      pagamento: dto.pagamento ?? null,
      vehicleId: dto.vehicleId ? new Types.ObjectId(dto.vehicleId) : null,
      // visibilita e statoOcr: default dello schema ("privato", "pending")
    });

    await this.remindersService.syncForDocument(doc._id, doc.dataScadenza);

    // OCR in background: la risposta all'upload non aspetta l'estrazione
    void this.runOcr(doc._id, dto.categoria, file);

    return this.toDto(doc);
  }

  /**
   * Estrazione asincrona: aggiorna datiEstratti/statoOcr al termine e
   * completa dataScadenza/dataDocumento solo se l'utente non li ha forniti.
   * Ogni errore finisce in statoOcr="errore" senza toccare il documento.
   */
  private async runOcr(
    docId: Types.ObjectId,
    categoria: string,
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      const categorie = await this.categoriesService.findAll();
      const result = await this.ocrService.extract({
        buffer: file.buffer,
        mimeType: file.mimetype,
        fileName: file.originalname,
        categoria,
        categorie: categorie.map((c) => c.nome),
        templateCampi:
          categorie.find((c) => c.nome === categoria)?.templateCampi ?? [],
      });

      const update: Record<string, unknown> = {
        statoOcr: 'completato',
        datiEstratti: result.datiEstratti ?? {},
      };
      if (result.importo != null) {
        update['datiEstratti.importo'] = String(result.importo);
      }
      const doc = await this.docModel.findById(docId).exec();
      if (!doc) return; // eliminato durante l'estrazione
      if (!doc.dataScadenza && result.dataScadenza) {
        update.dataScadenza = new Date(result.dataScadenza);
        await this.remindersService.syncForDocument(
          docId,
          update.dataScadenza as Date,
        );
      }
      await this.docModel.updateOne({ _id: docId }, update).exec();
    } catch (err) {
      this.logger.warn(
        `OCR fallito per documento ${docId.toHexString()}: ${err}`,
      );
      await this.docModel
        .updateOne({ _id: docId }, { statoOcr: 'errore' })
        .exec()
        .catch(() => undefined);
    }
  }

  async list(
    user: AuthenticatedUser,
    query: ListDocumentsQueryDto,
  ): Promise<PaginatedDto<DocumentDto>> {
    const filter: QueryFilter<HomeDoc> = { ...this.visibilityFilter(user) };

    if (query.categoria) filter.categoria = query.categoria;
    if (query.visibilita === 'privato') {
      // "i miei privati": il filtro di visibilità garantisce già che siano solo i propri
      filter.visibilita = 'privato';
    } else if (query.visibilita === 'condiviso') {
      filter.visibilita = 'condiviso';
    }
    if (query.scadenzaEntro) {
      filter.dataScadenza = { $ne: null, $lte: new Date(query.scadenzaEntro) };
    }
    if (query.search) {
      filter.titolo = { $regex: query.search, $options: 'i' };
    }

    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const page = query.page ?? 1;

    const [items, total] = await Promise.all([
      this.docModel
        .find(filter)
        .sort(query.scadenzaEntro ? { dataScadenza: 1 } : { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.docModel.countDocuments(filter).exec(),
    ]);

    return { items: items.map((d) => this.toDto(d)), total, page, limit };
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<DocumentDto> {
    return this.toDto(await this.findVisibleOrThrow(user, id));
  }

  /** URL firmato temporaneo del file, soggetto allo stesso filtro di visibilità. */
  async getFileUrl(
    user: AuthenticatedUser,
    id: string,
  ): Promise<{ url: string }> {
    const doc = await this.findVisibleOrThrow(user, id);
    return { url: await this.storageService.presignedGetUrl(doc.fileKey) };
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateDocumentInputDto,
  ): Promise<DocumentDto> {
    const doc = await this.findOwnedOrThrow(user, id);

    if (dto.categoria !== undefined) {
      if (!(await this.categoriesService.existsBySlug(dto.categoria))) {
        throw new BadRequestException(
          `Categoria "${dto.categoria}" inesistente`,
        );
      }
      doc.categoria = dto.categoria;
    }
    if (dto.titolo !== undefined) doc.titolo = dto.titolo;
    if (dto.descrizione !== undefined) doc.descrizione = dto.descrizione;
    if (dto.dataDocumento !== undefined)
      doc.dataDocumento = new Date(dto.dataDocumento);
    if (dto.dataScadenza !== undefined) {
      doc.dataScadenza = dto.dataScadenza ? new Date(dto.dataScadenza) : null;
    }
    if (dto.datiEstratti !== undefined) doc.datiEstratti = dto.datiEstratti;
    if (dto.pagamento !== undefined) {
      doc.pagamento = dto.pagamento
        ? {
            ...dto.pagamento,
            dataPagamento: new Date(dto.pagamento.dataPagamento),
          }
        : null;
    }

    await doc.save();
    await this.remindersService.syncForDocument(doc._id, doc.dataScadenza);
    return this.toDto(doc);
  }

  /** Cambio visibilità: solo il proprietario, in entrambe le direzioni (3bis.2/3). */
  async changeVisibility(
    user: AuthenticatedUser,
    id: string,
    visibilita: Visibilita,
  ): Promise<DocumentDto> {
    const doc = await this.findOwnedOrThrow(user, id);
    doc.visibilita = visibilita;
    await doc.save();
    return this.toDto(doc);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const doc = await this.findOwnedOrThrow(user, id);
    await this.storageService.delete(doc.fileKey);
    await this.remindersService.removeForDocument(doc._id);
    await doc.deleteOne();
  }

  private toDto(doc: HomeDocDocument): DocumentDto {
    return {
      id: doc._id.toHexString(),
      householdId: doc.householdId.toHexString(),
      uploadedBy: doc.uploadedBy.toHexString(),
      categoria: doc.categoria,
      titolo: doc.titolo,
      descrizione: doc.descrizione,
      // il client ottiene il file via GET /documents/:id/file (URL firmato)
      fileUrl: `/documents/${doc._id.toHexString()}/file`,
      fileType: doc.fileType,
      dataDocumento: doc.dataDocumento.toISOString(),
      dataScadenza: doc.dataScadenza?.toISOString() ?? null,
      visibilita: doc.visibilita,
      datiEstratti: doc.datiEstratti,
      statoOcr: doc.statoOcr,
      pagamento: doc.pagamento
        ? {
            importo: doc.pagamento.importo,
            valuta: doc.pagamento.valuta,
            metodoPagamento: doc.pagamento.metodoPagamento,
            dataPagamento: doc.pagamento.dataPagamento.toISOString(),
            ricevutaUrl: doc.pagamento.ricevutaUrl,
          }
        : undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
