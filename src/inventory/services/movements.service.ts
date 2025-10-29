import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movement } from '../entities/movement.entity';
import { Product } from '../entities/product.entity';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(companyId: string) {
    return this.movementRepository.find({
      where: { companyId, isActive: true },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: string, companyId: string) {
    return this.movementRepository.find({
      where: {
        companyId,
        isActive: true,
        product: { id: productId },
      },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateMovementDto, user: AuthenticatedUser) {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, companyId: user.companyId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    if (dto.type === 'out' && product.stock - dto.quantity < 0) {
      throw new BadRequestException({ message: 'Stock insuficiente' });
    }

    product.stock += dto.type === 'in' ? dto.quantity : -dto.quantity;
    await this.productRepository.save(product);

    const movement = this.movementRepository.create({
      product,
      quantity: dto.quantity,
      type: dto.type,
      reason: dto.reason ?? null,
      companyId: user.companyId,
      isActive: true,
    });

    return this.movementRepository.save(movement);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const movement = await this.movementRepository.findOne({
      where: { id, companyId: user.companyId, isActive: true },
      relations: ['product'],
    });

    if (!movement) {
      throw new NotFoundException({ message: 'Movimiento no encontrado' });
    }

    const adjustment = movement.type === 'in' ? -movement.quantity : movement.quantity;
    const product = movement.product;
    product.stock += adjustment;

    if (product.stock < 0) {
      throw new BadRequestException({ message: 'No se puede eliminar el movimiento' });
    }

    await this.productRepository.save(product);
    await this.movementRepository.update(id, { isActive: false });
    return { id };
  }
}
