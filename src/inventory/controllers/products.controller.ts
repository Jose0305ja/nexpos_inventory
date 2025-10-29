import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';

class StockAdjustmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

@Controller('inventory/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private extractCompanyId(req: Request & { companyId?: string }): string {
    return req.companyId as string;
  }

  @Get()
  async findAll(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const products = await this.productsService.findAll(companyId);
    return {
      message: 'Products retrieved successfully',
      data: products,
    };
  }

  @Get('search')
  async search(@Req() req: Request & { companyId?: string }, @Query('query') query: string) {
    const companyId = this.extractCompanyId(req);
    const products = await this.productsService.search(query, companyId);
    return {
      message: 'Search completed',
      data: products,
    };
  }

  @Get('low-stock')
  async lowStock(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const products = await this.productsService.findLowStock(companyId);
    return {
      message: 'Low stock products retrieved',
      data: products,
    };
  }

  @Get('out-of-stock')
  async outOfStock(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const products = await this.productsService.findOutOfStock(companyId);
    return {
      message: 'Out of stock products retrieved',
      data: products,
    };
  }

  @Get(':id')
  async findOne(@Req() req: Request & { companyId?: string }, @Param('id', ParseUUIDPipe) id: string) {
    const companyId = this.extractCompanyId(req);
    const product = await this.productsService.findOne(id, companyId);
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  @Post()
  async create(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) createProductDto: CreateProductDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const product = await this.productsService.create(createProductDto, companyId);
    return {
      message: 'Product created successfully',
      data: product,
    };
  }

  @Patch(':id')
  async update(
    @Req() req: Request & { companyId?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) updateProductDto: UpdateProductDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const product = await this.productsService.update(id, companyId, updateProductDto);
    return {
      message: 'Product updated successfully',
      data: product,
    };
  }

  @Delete(':id')
  async deactivate(@Req() req: Request & { companyId?: string }, @Param('id', ParseUUIDPipe) id: string) {
    const companyId = this.extractCompanyId(req);
    await this.productsService.deactivate(id, companyId);
    return {
      message: 'Product deactivated successfully',
      data: { id },
    };
  }

  @Patch(':id/restock')
  async restock(
    @Req() req: Request & { companyId?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) body: StockAdjustmentDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const product = await this.productsService.restock(id, companyId, Number(body.quantity));
    return {
      message: 'Product restocked successfully',
      data: product,
    };
  }

  @Patch(':id/decrease')
  async decrease(
    @Req() req: Request & { companyId?: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true })) body: StockAdjustmentDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const product = await this.productsService.decrease(id, companyId, Number(body.quantity));
    return {
      message: 'Product stock decreased successfully',
      data: product,
    };
  }
}
