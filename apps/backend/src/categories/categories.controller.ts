import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DocumentCategoryDto } from '@homedocs/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<DocumentCategoryDto[]> {
    return this.categoriesService.findAll();
  }
}
