import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll(companyId: string) {
    return this.categoryRepository.find({
      where: { companyId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(companyId: string, id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    return category;
  }

  async create(companyId: string, createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      companyId,
      isActive: true,
    });

    return this.categoryRepository.save(category);
  }

  async update(
    companyId: string,
    id: string,
    updateCategoryDto: CreateCategoryDto,
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(companyId: string, id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException({ message: 'Categoría no encontrada' });
    }

    await this.categoryRepository.update(id, { isActive: false });
    return { id, isActive: false };
  }
}
