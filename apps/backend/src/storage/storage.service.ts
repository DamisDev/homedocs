import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client;
  /**
   * Client separato per gli URL firmati: la firma S3 include l'host, quindi
   * va generata per l'host che il browser userà davvero (MINIO_PUBLIC_ENDPOINT,
   * es. "localhost" in dev), non per quello interno alla rete Docker.
   */
  private readonly presignClient: Minio.Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const common = {
      port: Number(this.configService.get<string>('MINIO_PORT') ?? 9000),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
      // region fissa: evita al client di firma la scoperta via rete
      // (l'endpoint pubblico non è raggiungibile dal container)
      region: 'us-east-1',
    };
    const endPoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    this.client = new Minio.Client({ ...common, endPoint });
    this.presignClient = new Minio.Client({
      ...common,
      endPoint:
        this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') ?? endPoint,
    });
    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET');
  }

  async onModuleInit(): Promise<void> {
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket "${this.bucket}" creato`);
    }
  }

  /**
   * Carica un file e ritorna la object key. La key è namespaced per household
   * ma la vera autorizzazione resta il filtro di visibilità nel DocumentsService.
   */
  async upload(
    householdId: string,
    originalName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const safeName = originalName.replace(/[^\w.-]+/g, '_').slice(-80);
    const objectKey = `${householdId}/${randomUUID()}-${safeName}`;
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
    return objectKey;
  }

  /** URL firmato temporaneo per scaricare/visualizzare il file. */
  presignedGetUrl(objectKey: string, expirySeconds = 300): Promise<string> {
    return this.presignClient.presignedGetObject(
      this.bucket,
      objectKey,
      expirySeconds,
    );
  }

  async delete(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }
}
