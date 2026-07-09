import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { OcrModule } from '../ocr/ocr.module';
import { RemindersModule } from '../reminders/reminders.module';
import { StorageModule } from '../storage/storage.module';
import { HomeDoc, HomeDocSchema } from './document.schema';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HomeDoc.name, schema: HomeDocSchema }]),
    AuthModule,
    CategoriesModule,
    StorageModule,
    OcrModule,
    RemindersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
