import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class InventoryService {
  private rfidMode = false;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getHomeSummary() {
    const activeProducts = await this.productRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    const outOfStock = activeProducts.filter((product) => product.stock === 0);
    const lowStock = activeProducts.filter(
      (product) => product.stock > 0 && product.stock < product.minStock,
    );
    const nearMinimum = activeProducts.filter((product) => product.stock === product.minStock);
    const overstock = activeProducts.filter((product) => product.stock > product.minStock * 2);

    return {
      out_of_stock: outOfStock,
      low_stock: lowStock,
      expiring: [],
      near_minimum: nearMinimum,
      overstock,
      all: activeProducts,
    };
  }

  async getProducts() {
    return this.productRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException({
        message: 'Producto no encontrado',
        data: {},
      });
    }

    return product;
  }

  async createProduct(dto: CreateProductDto) {
    const product = this.productRepository.create({
      name: dto.name,
      price: dto.price,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 5,
    });

    return this.productRepository.save(product);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.getProductById(id);
    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async deactivateProduct(id: string) {
    const product = await this.getProductById(id);
    product.isActive = false;
    return this.productRepository.save(product);
  }

  async searchProducts(rawQuery: string) {
    const trimmedQuery = (rawQuery ?? '').trim();
    const normalizedQuery = trimmedQuery.toLowerCase();

    if (!normalizedQuery) {
      throw new BadRequestException({
        message: 'Debe proporcionar un término de búsqueda',
        data: {},
      });
    }

    return this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(product.name) LIKE :query OR product.id = :exactId)',
        {
          query: `%${normalizedQuery}%`,
          exactId: trimmedQuery,
        },
      )
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async getGeneralStats() {
    const [total, active, outOfStock, lowStock] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { isActive: true } }),
      this.productRepository.count({ where: { isActive: true, stock: 0 } }),
      this.productRepository
        .createQueryBuilder('product')
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.stock < product.minStock')
        .getCount(),
    ]);

    return {
      total_products: total,
      active_products: active,
      inactive_products: total - active,
      out_of_stock: outOfStock,
      low_stock: lowStock,
    };
  }

  setRfidMode(entryMode: boolean) {
    this.rfidMode = entryMode;
    return this.rfidMode;
  }

  getRfidMode() {
    return this.rfidMode;
  }

  acknowledgeVoiceCommand(command: string) {
    void command;
    return {};
  }

  executeVoiceAction(productId: string, action: string) {
    void productId;
    void action;
    return {};
  }
}
