import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { Category } from '../entities/category.entity';
import { Movement } from '../entities/movement.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Movement)
    private readonly movementsRepository: Repository<Movement>,
  ) {}

  async create(dto: CreateProductDto, companyId: string): Promise<Product> {
    const category = await this.resolveCategory(dto.categoryId, companyId);

    const product = this.productsRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock ?? 0,
      minStock: dto.minStock ?? 0,
      barcode: dto.barcode,
      category,
      companyId,
    });

    return this.productsRepository.save(product);
  }

  async findAll(companyId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { companyId, isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, companyId, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, companyId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, companyId, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.categoryId !== undefined) {
      product.category = await this.resolveCategory(dto.categoryId, companyId);
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.minStock !== undefined) product.minStock = dto.minStock;
    if (dto.barcode !== undefined) product.barcode = dto.barcode;

    return this.productsRepository.save(product);
  }

  async deactivate(id: string, companyId: string): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = false;
    await this.productsRepository.save(product);
  }

  async restock(id: string, companyId: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const product = await this.productsRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.stock += quantity;
    await this.productsRepository.save(product);

    await this.movementsRepository.save(
      this.movementsRepository.create({
        product,
        quantity,
        type: 'in',
        companyId,
        reason: 'Restock',
      }),
    );

    return this.productsRepository.findOne({ where: { id: product.id, companyId }, relations: ['category'] });
  }

  async decrease(id: string, companyId: string, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    const product = await this.productsRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock - quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    product.stock -= quantity;
    await this.productsRepository.save(product);

    await this.movementsRepository.save(
      this.movementsRepository.create({
        product,
        quantity,
        type: 'out',
        companyId,
        reason: 'Manual decrease',
      }),
    );

    return this.productsRepository.findOne({ where: { id: product.id, companyId }, relations: ['category'] });
  }

  async search(query: string, companyId: string): Promise<Product[]> {
    if (!query) {
      return [];
    }

    return this.productsRepository.find({
      where: [
        { companyId, isActive: true, name: ILike(`%${query}%`) },
        { companyId, isActive: true, barcode: ILike(`%${query}%`) },
      ],
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findLowStock(companyId: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('product.stock < product."minStock"')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async findOutOfStock(companyId: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('product.stock = 0')
      .orderBy('product.updatedAt', 'DESC')
      .getMany();
  }

  private async resolveCategory(categoryId: string | undefined, companyId: string): Promise<Category | null> {
    if (!categoryId) {
      return null;
    }

    const category = await this.categoriesRepository.findOne({ where: { id: categoryId, companyId, isActive: true } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}
