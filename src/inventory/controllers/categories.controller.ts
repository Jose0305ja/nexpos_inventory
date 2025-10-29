import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesService } from '../services/categories.service';

@Controller('inventory/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private extractCompanyId(req: Request & { companyId?: string }): string {
    return req.companyId as string;
  }

  @Get()
  async findAll(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const categories = await this.categoriesService.findAll(companyId);
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  async findOne(@Req() req: Request & { companyId?: string }, @Param('id', ParseUUIDPipe) id: string) {
    const companyId = this.extractCompanyId(req);
    const category = await this.categoriesService.findOne(id, companyId);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Post()
  async create(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) createCategoryDto: CreateCategoryDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const category = await this.categoriesService.create(createCategoryDto, companyId);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { companyId?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) updateCategoryDto: UpdateCategoryDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const category = await this.categoriesService.update(id, companyId, updateCategoryDto);
    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  async deactivate(@Req() req: Request & { companyId?: string }, @Param('id', ParseUUIDPipe) id: string) {
    const companyId = this.extractCompanyId(req);
    await this.categoriesService.deactivate(id, companyId);
    return {
      message: 'Category deactivated successfully',
      data: { id },
    };
  }
}
