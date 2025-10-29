import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto, companyId: string): Promise<Category> {
    const category = this.categoriesRepository.create({
      name: dto.name,
      description: dto.description,
      companyId,
    });

    return this.categoriesRepository.save(category);
  }

  async findAll(companyId: string): Promise<Category[]> {
    return this.categoriesRepository.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, companyId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name !== undefined) category.name = dto.name;
    if (dto.description !== undefined) category.description = dto.description;

    return this.categoriesRepository.save(category);
  }

  async deactivate(id: string, companyId: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({ where: { id, companyId, isActive: true } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.isActive = false;
    await this.categoriesRepository.save(category);
  }
}
