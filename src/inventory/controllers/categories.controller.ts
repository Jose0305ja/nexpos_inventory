import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { buildResponse } from '../../shared/utils/response.helper';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: 'admin' | 'employee';
    companyId: string;
  };
}

@Controller('inventory/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const data = await this.categoriesService.findAll(req.user.companyId);
    return buildResponse('Categorías obtenidas correctamente', data);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const data = await this.categoriesService.findOne(req.user.companyId, id);
    return buildResponse('Categoría obtenida correctamente', data);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.categoriesService.create(
      req.user.companyId,
      createCategoryDto,
    );
    return buildResponse('Categoría creada correctamente', data);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.categoriesService.update(
      req.user.companyId,
      id,
      updateCategoryDto,
    );
    return buildResponse('Categoría actualizada correctamente', data);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req.user.role);
    const data = await this.categoriesService.remove(req.user.companyId, id);
    return buildResponse('Categoría eliminada correctamente', data);
  }

  private ensureAdmin(role: 'admin' | 'employee') {
    if (role !== 'admin') {
      throw new ForbiddenException({ message: 'Acción no permitida' });
    }
  }
}
