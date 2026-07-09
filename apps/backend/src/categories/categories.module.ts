import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import {
  DocumentCategory,
  DocumentCategorySchema,
} from './document-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentCategory.name, schema: DocumentCategorySchema },
    ]),
    AuthModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
