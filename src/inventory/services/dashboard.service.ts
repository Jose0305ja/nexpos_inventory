import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Movement } from '../entities/movement.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Movement)
    private readonly movementsRepository: Repository<Movement>,
  ) {}

  async getOverview(companyId: string) {
    const [totalProducts, activeProducts, totalCategories, stockData] = await Promise.all([
      this.productsRepository.count({ where: { companyId } }),
      this.productsRepository.count({ where: { companyId, isActive: true } }),
      this.categoriesRepository.count({ where: { companyId, isActive: true } }),
      this.productsRepository
        .createQueryBuilder('product')
        .select('COALESCE(SUM(product.stock), 0)', 'totalStock')
        .where('product.companyId = :companyId', { companyId })
        .andWhere('product.isActive = true')
        .getRawOne(),
    ]);

    const recentMovements = await this.movementsRepository.find({
      where: { companyId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalProducts,
      activeProducts,
      totalCategories,
      totalStock: Number(stockData?.totalStock ?? 0),
      recentMovements,
    };
  }

  async getAlerts(companyId: string) {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .andWhere('product.stock < product."minStock"')
      .orderBy('product.stock', 'ASC')
      .getMany();
  }

  async getTrends(companyId: string) {
    const topProducts = await this.movementsRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'name')
      .addSelect('SUM(movement.quantity)', 'totalQuantity')
      .where('movement.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('SUM(movement.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return topProducts.map((product) => ({
      productId: product.productId,
      name: product.name,
      totalQuantity: Number(product.totalQuantity),
    }));
  }
}
