import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movement } from '../entities/movement.entity';
import { Product } from '../entities/product.entity';
import { CreateMovementDto } from '../dto/create-movement.dto';

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
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(companyId: string, productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, companyId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    return this.movementRepository.find({
      where: {
        companyId,
        product: { id: productId },
        isActive: true,
      },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(companyId: string, createMovementDto: CreateMovementDto) {
    const product = await this.productRepository.findOne({
      where: { id: createMovementDto.productId, companyId, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException({ message: 'Producto no encontrado' });
    }

    if (createMovementDto.type === 'out' && product.stock < createMovementDto.quantity) {
      throw new ForbiddenException({ message: 'Stock insuficiente' });
    }

    if (createMovementDto.type === 'in') {
      product.stock += createMovementDto.quantity;
    } else {
      product.stock -= createMovementDto.quantity;
    }

    await this.productRepository.save(product);

    const movement = this.movementRepository.create({
      product,
      quantity: createMovementDto.quantity,
      type: createMovementDto.type,
      reason: createMovementDto.reason ?? null,
      companyId,
      isActive: true,
    });

    return this.movementRepository.save(movement);
  }

  async remove(companyId: string, id: string) {
    const movement = await this.movementRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!movement) {
      throw new NotFoundException({ message: 'Movimiento no encontrado' });
    }

    await this.movementRepository.update(id, { isActive: false });
    return { id, isActive: false };
  }
}
