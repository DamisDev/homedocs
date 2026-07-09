import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OcrExtractionResultDto } from '@homedocs/shared-types';

const OCR_TIMEOUT_MS = 180_000;

/** Client verso apps/ocr-service (FastAPI + Claude API). */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly baseUrl: string;

  constructor(configService: ConfigService) {
    this.baseUrl =
      configService.get<string>('OCR_SERVICE_URL') ?? 'http://localhost:8000';
  }

  /** Invia il file al servizio OCR. Solleva in caso di errore (gestito dal chiamante). */
  async extract(params: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
    categoria: string;
    categorie: string[];
    templateCampi: string[];
  }): Promise<OcrExtractionResultDto> {
    const form = new FormData();
    form.set(
      'file',
      new Blob([new Uint8Array(params.buffer)], { type: params.mimeType }),
      params.fileName,
    );
    form.set('categoria', params.categoria);
    form.set('categorie', JSON.stringify(params.categorie));
    form.set('templateCampi', JSON.stringify(params.templateCampi));

    const res = await fetch(`${this.baseUrl}/extract`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`OCR service ${res.status}: ${detail.slice(0, 300)}`);
    }
    return (await res.json()) as OcrExtractionResultDto;
  }
}
