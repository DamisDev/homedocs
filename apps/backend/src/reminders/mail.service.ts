import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST') ?? 'localhost',
      port: Number(configService.get<string>('SMTP_PORT') ?? 1025),
      secure: configService.get('SMTP_SECURE') === 'true',
      auth: configService.get<string>('SMTP_USER')
        ? {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          }
        : undefined,
    });
    this.from =
      configService.get<string>('MAIL_FROM') ??
      'HomeDocs <noreply@homedocs.local>';
  }

  async send(to: string[], subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({ from: this.from, to, subject, html });
    this.logger.log(`Email inviata a ${to.join(', ')}: ${subject}`);
  }
}
