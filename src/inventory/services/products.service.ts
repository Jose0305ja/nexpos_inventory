import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Movement } from '../entities/movement.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
  ) {}

  async findAll(companyId: string) {
    return this.productRepository.find({
      where: { companyId, isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const product = await this.productRepository.findOne({
      where: { id, companyId, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    return product;
  }

  private async findOneIncludingInactive(id: string, companyId: string) {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    return product;
  }

  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const { categoryId, ...rest } = dto;

    const category = categoryId
      ? await this.validateCategory(categoryId, user.companyId)
      : null;

    const product = this.productRepository.create({
      ...rest,
      companyId: user.companyId,
      category,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 5,
    });

    return this.productRepository.save(product);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findOneIncludingInactive(id, user.companyId);

    const { categoryId, removeCategory, ...rest } = dto;

    if (categoryId !== undefined) {
      if (!categoryId) {
        throw new BadRequestException({ message: 'Categoría inválida' });
      }

      product.category = await this.validateCategory(categoryId, user.companyId);
    }

    if (removeCategory) {
      product.category = null;
    }

    Object.assign(product, rest);
    return this.productRepository.save(product);
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.findOne(id, user.companyId);
    await this.productRepository.update(id, { isActive: false });
    return { id };
  }

  async reactivate(id: string, user: AuthenticatedUser) {
    const product = await this.findOneIncludingInactive(id, user.companyId);
    product.isActive = true;
    return this.productRepository.save(product);
  }

  async restock(
    id: string,
    dto: AdjustStockDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findOne(id, user.companyId);
    product.stock += dto.quantity;
    await this.productRepository.save(product);

    await this.createMovementRecord(product, dto.quantity, 'in', user, dto.reason);
    return product;
  }

  async decrease(
    id: string,
    dto: AdjustStockDto,
    user: AuthenticatedUser,
  ) {
    const product = await this.findOne(id, user.companyId);

    if (product.stock - dto.quantity < 0) {
      throw new BadRequestException({ message: 'Stock insuficiente' });
    }

    product.stock -= dto.quantity;
    await this.productRepository.save(product);

    await this.createMovementRecord(product, dto.quantity, 'out', user, dto.reason);
    return product;
  }

  async search(query: string, companyId: string) {
    if (!query) {
      return [];
    }

    return this.productRepository.find({
      where: [
        { companyId, isActive: true, name: ILike(`%${query}%`) },
        { companyId, isActive: true, description: ILike(`%${query}%`) },
        { companyId, isActive: true, barcode: ILike(`%${query}%`) },
      ],
      relations: ['category'],
    });
  }

  async findLowStock(companyId: string) {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('product.stock > 0')
      .andWhere('product.stock <= product.minStock')
      .getMany();
  }

  async findOutOfStock(companyId: string) {
    return this.productRepository.find({
      where: { companyId, isActive: true, stock: 0 },
      relations: ['category'],
    });
  }

  async findByCategory(categoryId: string, companyId: string) {
    return this.productRepository.find({
      where: {
        companyId,
        isActive: true,
        category: { id: categoryId, isActive: true },
      },
      relations: ['category'],
    });
  }

  private async validateCategory(id: string, companyId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    return category;
  }

  private async createMovementRecord(
    product: Product,
    quantity: number,
    type: 'in' | 'out',
    user: AuthenticatedUser,
    reason?: string,
  ) {
    const movement = this.movementRepository.create({
      product,
      quantity,
      type,
      reason: reason ?? (type === 'in' ? 'Reabastecimiento manual' : 'Salida manual'),
      companyId: user.companyId,
      isActive: true,
    });

    await this.movementRepository.save(movement);
  }
}
