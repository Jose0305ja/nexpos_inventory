import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { buildResponse } from '../../shared/utils/response.helper';
import { UpdateStockDto } from '../dto/update-stock.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: 'admin' | 'employee';
    companyId: string;
  };
}

@Controller('inventory/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const data = await this.productsService.findAll(req.user.companyId);
    return buildResponse('Productos obtenidos correctamente', data);
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('query') query: string,
  ) {
    const data = await this.productsService.search(req.user.companyId, query ?? '');
    return buildResponse('Búsqueda de productos completada', data);
  }

  @Get('low-stock')
  async lowStock(@Req() req: AuthenticatedRequest) {
    const data = await this.productsService.findLowStock(req.user.companyId);
    return buildResponse('Productos con stock bajo obtenidos', data);
  }

  @Get('out-of-stock')
  async outOfStock(@Req() req: AuthenticatedRequest) {
    const data = await this.productsService.findOutOfStock(req.user.companyId);
    return buildResponse('Productos agotados obtenidos', data);
  }

  @Get('category/:categoryId')
  async byCategory(
    @Req() req: AuthenticatedRequest,
    @Param('categoryId') categoryId: string,
  ) {
    const data = await this.productsService.findByCategory(
      req.user.companyId,
      categoryId,
    );
    return buildResponse('Productos por categoría obtenidos', data);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const data = await this.productsService.findOne(req.user.companyId, id);
    return buildResponse('Producto obtenido correctamente', data);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createProductDto: CreateProductDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.create(
      req.user.companyId,
      createProductDto,
    );
    return buildResponse('Producto creado correctamente', data);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.update(
      req.user.companyId,
      id,
      updateProductDto,
    );
    return buildResponse('Producto actualizado correctamente', data);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.remove(req.user.companyId, id);
    return buildResponse('Producto eliminado correctamente', data);
  }

  @Patch(':id/restock')
  async restock(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.restock(
      req.user.companyId,
      id,
      updateStockDto.quantity,
    );
    return buildResponse('Stock incrementado correctamente', data);
  }

  @Patch(':id/decrease')
  async decrease(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.decrease(
      req.user.companyId,
      id,
      updateStockDto.quantity,
    );
    return buildResponse('Stock reducido correctamente', data);
  }

  @Patch(':id/reactivate')
  async reactivate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    this.ensureAdmin(req.user.role);
    const data = await this.productsService.reactivate(req.user.companyId, id);
    return buildResponse('Producto reactivado correctamente', data);
  }

  private ensureAdmin(role: 'admin' | 'employee') {
    if (role !== 'admin') {
      throw new ForbiddenException({ message: 'Acción no permitida' });
    }
  }
}
