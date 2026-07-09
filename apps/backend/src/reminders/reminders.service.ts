import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HomeDoc } from '../documents/document.schema';
import { User } from '../users/user.schema';
import { MailService } from './mail.service';
import { DEFAULT_GIORNI_ANTICIPO, Reminder } from './reminder.schema';

const DATE_FMT = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectModel(Reminder.name) private readonly reminderModel: Model<Reminder>,
    @InjectModel(HomeDoc.name) private readonly docModel: Model<HomeDoc>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Tiene il reminder allineato al documento: chiamato da DocumentsService
   * a ogni create/update/delete. Un documento senza scadenza non ha reminder.
   */
  async syncForDocument(
    docId: Types.ObjectId,
    dataScadenza: Date | null,
  ): Promise<void> {
    if (!dataScadenza) {
      await this.reminderModel.deleteOne({ documentId: docId }).exec();
      return;
    }
    const existing = await this.reminderModel
      .findOne({ documentId: docId })
      .exec();
    if (
      existing &&
      existing.dataScadenza.getTime() === dataScadenza.getTime()
    ) {
      return;
    }
    // scadenza nuova o cambiata: si riparte da zero con le notifiche
    await this.reminderModel
      .updateOne(
        { documentId: docId },
        {
          dataScadenza,
          stato: 'attivo',
          notificheInviate: [],
          $setOnInsert: {
            tipoNotifica: 'email',
            giorniAnticipoNotifica: DEFAULT_GIORNI_ANTICIPO,
          },
        },
        { upsert: true },
      )
      .exec();
  }

  async removeForDocument(docId: Types.ObjectId): Promise<void> {
    await this.reminderModel.deleteOne({ documentId: docId }).exec();
  }

  /** Cron giornaliero (8:00). Espone la logica anche per il trigger manuale. */
  @Cron('0 8 * * *')
  async checkScadenze(): Promise<{ notificheInviate: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let sent = 0;
    const reminders = await this.reminderModel
      .find({ stato: { $ne: 'scaduto' } })
      .exec();

    for (const reminder of reminders) {
      const scadenza = new Date(reminder.dataScadenza);
      scadenza.setHours(0, 0, 0, 0);
      const daysLeft = Math.round(
        (scadenza.getTime() - today.getTime()) / 86_400_000,
      );

      if (daysLeft < 0) {
        reminder.stato = 'scaduto';
        await reminder.save();
        continue;
      }

      // soglia più vicina raggiunta e non ancora notificata
      // (es. daysLeft=14 → soglia 15 se non già inviata: recupera i cron mancati)
      const due = reminder.giorniAnticipoNotifica
        .filter((g) => g >= daysLeft && !reminder.notificheInviate.includes(g))
        .sort((a, b) => a - b)[0];
      if (due === undefined) continue;

      try {
        await this.notify(reminder.documentId, daysLeft);
        reminder.notificheInviate.push(
          ...reminder.giorniAnticipoNotifica.filter((g) => g >= daysLeft),
        );
        reminder.stato = 'inviato';
        await reminder.save();
        sent += 1;
      } catch (err) {
        this.logger.warn(
          `Notifica fallita per reminder ${reminder.id}: ${err}`,
        );
      }
    }

    this.logger.log(`Controllo scadenze completato: ${sent} notifiche inviate`);
    return { notificheInviate: sent };
  }

  /**
   * Destinatari secondo la regola di privacy (3bis.5): documento privato →
   * solo chi l'ha caricato; condiviso → tutti i membri dell'household.
   */
  private async notify(docId: Types.ObjectId, daysLeft: number): Promise<void> {
    const doc = await this.docModel.findById(docId).exec();
    if (!doc || !doc.dataScadenza) return;

    const recipients =
      doc.visibilita === 'condiviso'
        ? await this.userModel.find({ householdId: doc.householdId }).exec()
        : await this.userModel.find({ _id: doc.uploadedBy }).exec();
    if (recipients.length === 0) return;

    const dataStr = DATE_FMT.format(doc.dataScadenza);
    const quando =
      daysLeft === 0
        ? 'oggi'
        : daysLeft === 1
          ? 'domani'
          : `tra ${daysLeft} giorni`;

    await this.mailService.send(
      recipients.map((u) => u.email),
      `⏰ "${doc.titolo}" scade ${quando}`,
      `<div style="font-family:sans-serif;max-width:560px">
        <h2 style="color:#C4622D">HomeDocs — promemoria scadenza</h2>
        <p>Il documento <strong>${doc.titolo}</strong> (${doc.categoria.replaceAll('_', ' ')})
        scade <strong>${quando}</strong>, il ${dataStr}.</p>
        <p style="color:#6E655B;font-size:13px">Ricevi questa email perché il documento è
        ${doc.visibilita === 'condiviso' ? 'condiviso con la tua famiglia' : 'nel tuo spazio privato'}.</p>
      </div>`,
    );
  }
}
