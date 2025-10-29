import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ResponseHelper } from '../../shared/utils/response.helper';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../shared/interfaces/auth-request.interface';

@Controller('inventory/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const categories = await this.categoriesService.findAll(user.companyId);
    return ResponseHelper.success('Categorías obtenidas correctamente', categories);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    const category = await this.categoriesService.findOne(id, user.companyId);
    return ResponseHelper.success('Categoría obtenida correctamente', category);
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCategoryDto) {
    const { user } = req;
    this.ensureAdmin(user);
    const category = await this.categoriesService.create(dto, user);
    return ResponseHelper.success('Categoría creada correctamente', category);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const { user } = req;
    this.ensureAdmin(user);
    const category = await this.categoriesService.update(id, dto, user);
    return ResponseHelper.success('Categoría actualizada correctamente', category);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    this.ensureAdmin(user);
    await this.categoriesService.remove(id, user);
    return ResponseHelper.success('Categoría eliminada correctamente');
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException({ message: 'Acceso restringido a administradores' });
    }
  }
}
