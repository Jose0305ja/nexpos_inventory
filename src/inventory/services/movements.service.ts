import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { Movement } from '../entities/movement.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementsRepository: Repository<Movement>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(companyId: string): Promise<Movement[]> {
    return this.movementsRepository.find({
      where: { companyId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: string, companyId: string): Promise<Movement[]> {
    return this.movementsRepository.find({
      where: { companyId, product: { id: productId } },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateMovementDto, companyId: string): Promise<Movement> {
    return this.productsRepository.manager.transaction(async (manager) => {
      const productsRepo = manager.getRepository(Product);
      const movementsRepo = manager.getRepository(Movement);

      const product = await productsRepo.findOne({ where: { id: dto.productId, companyId } });

      if (!product || !product.isActive) {
        throw new NotFoundException('Product not found');
      }

      if (dto.type === 'out' && product.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      product.stock = dto.type === 'in' ? product.stock + dto.quantity : product.stock - dto.quantity;
      await productsRepo.save(product);

      const movement = movementsRepo.create({
        product,
        quantity: dto.quantity,
        type: dto.type,
        reason: dto.reason,
        companyId,
      });

      return movementsRepo.save(movement);
    });
  }
}
