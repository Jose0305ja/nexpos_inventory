import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Movement } from '../entities/movement.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

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
      order: { createdAt: 'DESC' },
    });
  }

  async search(companyId: string, query: string) {
    if (!query) {
      return this.findAll(companyId);
    }

    const normalized = `%${query.toLowerCase()}%`;

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere(
        '(LOWER(product.name) LIKE :query OR LOWER(COALESCE(product.description, \'\')) LIKE :query OR LOWER(COALESCE(product.barcode, \'\')) LIKE :query)',
        { query: normalized },
      )
      .orderBy('product.updatedAt', 'DESC')
      .getMany();
  }

  async findLowStock(companyId: string) {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('product.stock <= product.minStock')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async findOutOfStock(companyId: string) {
    return this.productRepository.find({
      where: {
        companyId,
        isActive: true,
        stock: 0,
      },
      relations: ['category'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findByCategory(companyId: string, categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('category.id = :categoryId', { categoryId })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  async findOne(companyId: string, id: string) {
    const product = await this.productRepository.findOne({
      where: { id, companyId, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    return product;
  }

  async create(companyId: string, createProductDto: CreateProductDto) {
    let category: Category | null = null;

    if (createProductDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: {
          id: createProductDto.categoryId,
          companyId,
          isActive: true,
        },
      });

      if (!category) {
        throw new NotFoundException({ message: 'Categoría no encontrada' });
      }
    }

    const { categoryId, ...rest } = createProductDto;

    const product = this.productRepository.create({
      ...rest,
      category: category ?? null,
      companyId,
      isActive: true,
    });

    return this.productRepository.save(product);
  }

  async update(
    companyId: string,
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
      relations: ['category'],
    });

    if (!product || !product.isActive) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    if (Object.prototype.hasOwnProperty.call(updateProductDto, 'categoryId')) {
      const categoryIdentifier = updateProductDto.categoryId;

      if (categoryIdentifier) {
        const category = await this.categoryRepository.findOne({
          where: {
            id: categoryIdentifier,
            companyId,
            isActive: true,
          },
        });

        if (!category) {
          throw new NotFoundException({ message: 'Categoría no encontrada' });
        }

        product.category = category;
      } else {
        product.category = null;
      }
    }

    const { categoryId: _categoryId, ...rest } = updateProductDto;
    Object.assign(product, rest);

    return this.productRepository.save(product);
  }

  async remove(companyId: string, id: string) {
    const product = await this.productRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    await this.productRepository.update(id, { isActive: false });
    return { id, isActive: false };
  }

  async restock(companyId: string, id: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException({ message: 'Cantidad inválida' });
    }

    const product = await this.findOne(companyId, id);
    product.stock += quantity;
    await this.productRepository.save(product);

    await this.movementRepository.save(
      this.movementRepository.create({
        product,
        quantity,
        type: 'in',
        reason: 'Restock manual',
        companyId,
        isActive: true,
      }),
    );

    return product;
  }

  async decrease(companyId: string, id: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException({ message: 'Cantidad inválida' });
    }

    const product = await this.findOne(companyId, id);

    if (product.stock < quantity) {
      throw new ForbiddenException({ message: 'Stock insuficiente' });
    }

    product.stock -= quantity;
    await this.productRepository.save(product);

    await this.movementRepository.save(
      this.movementRepository.create({
        product,
        quantity,
        type: 'out',
        reason: 'Ajuste manual',
        companyId,
        isActive: true,
      }),
    );

    return product;
  }

  async reactivate(companyId: string, id: string) {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    await this.productRepository.update(id, { isActive: true });
    return { id, isActive: true };
  }
}
