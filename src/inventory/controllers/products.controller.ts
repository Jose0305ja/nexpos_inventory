import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { ResponseHelper } from '../../shared/utils/response.helper';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../shared/interfaces/auth-request.interface';

@Controller('inventory/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const products = await this.productsService.findAll(user.companyId);
    return ResponseHelper.success('Productos obtenidos correctamente', products);
  }

  @Get('search')
  async search(@Req() req: AuthenticatedRequest, @Query('query') query: string) {
    const { user } = req;
    const products = await this.productsService.search(query, user.companyId);
    return ResponseHelper.success('Resultados de búsqueda', products);
  }

  @Get('low-stock')
  async lowStock(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const products = await this.productsService.findLowStock(user.companyId);
    return ResponseHelper.success('Productos con bajo stock', products);
  }

  @Get('out-of-stock')
  async outOfStock(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const products = await this.productsService.findOutOfStock(user.companyId);
    return ResponseHelper.success('Productos agotados', products);
  }

  @Get('category/:categoryId')
  async byCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryId') categoryId: string,
  ) {
    const { user } = req;
    const products = await this.productsService.findByCategory(
      categoryId,
      user.companyId,
    );
    return ResponseHelper.success('Productos por categoría', products);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    const product = await this.productsService.findOne(id, user.companyId);
    return ResponseHelper.success('Producto obtenido correctamente', product);
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProductDto) {
    const { user } = req;
    this.ensureAdmin(user);
    const product = await this.productsService.create(dto, user);
    return ResponseHelper.success('Producto creado correctamente', product);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const { user } = req;
    this.ensureAdmin(user);
    const product = await this.productsService.update(id, dto, user);
    return ResponseHelper.success('Producto actualizado correctamente', product);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    this.ensureAdmin(user);
    await this.productsService.remove(id, user);
    return ResponseHelper.success('Producto eliminado correctamente');
  }

  @Patch(':id/reactivate')
  async reactivate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    this.ensureAdmin(user);
    const product = await this.productsService.reactivate(id, user);
    return ResponseHelper.success('Producto reactivado correctamente', product);
  }

  @Patch(':id/restock')
  async restock(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    const { user } = req;
    this.ensureAdmin(user);
    const product = await this.productsService.restock(id, dto, user);
    return ResponseHelper.success('Stock actualizado correctamente', product);
  }

  @Patch(':id/decrease')
  async decrease(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
  ) {
    const { user } = req;
    this.ensureAdmin(user);
    const product = await this.productsService.decrease(id, dto, user);
    return ResponseHelper.success('Stock actualizado correctamente', product);
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException({ message: 'Acceso restringido a administradores' });
    }
  }
}
