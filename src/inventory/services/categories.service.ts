import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(companyId: string) {
    return this.categoryRepository.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    return category;
  }

  async create(dto: CreateCategoryDto, user: AuthenticatedUser) {
    const category = this.categoryRepository.create({
      ...dto,
      companyId: user.companyId,
    });

    return this.categoryRepository.save(category);
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    user: AuthenticatedUser,
  ) {
    const category = await this.findOne(id, user.companyId);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.findOne(id, user.companyId);
    await this.categoryRepository.update(id, { isActive: false });
    return { id };
  }
}
