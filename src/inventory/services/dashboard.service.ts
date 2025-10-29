import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Movement } from '../entities/movement.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getDashboard(companyId: string) {
    const [totalProducts, outOfStock, lowStock, totalMovements] = await Promise.all([
      this.productRepository.count({ where: { companyId, isActive: true } }),
      this.productRepository.count({ where: { companyId, isActive: true, stock: 0 } }),
      this.productRepository
        .createQueryBuilder('product')
        .where('product.companyId = :companyId', { companyId })
        .andWhere('product.isActive = true')
        .andWhere('product.stock <= product.minStock')
        .getCount(),
      this.movementRepository.count({ where: { companyId, isActive: true } }),
    ]);

    return {
      totalProducts,
      outOfStock,
      lowStock,
      totalMovements,
    };
  }

  async getTrends(companyId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const rows = await this.movementRepository
      .createQueryBuilder('movement')
      .select("DATE_TRUNC('day', movement.createdAt)", 'date')
      .addSelect('movement.type', 'type')
      .addSelect('SUM(movement.quantity)', 'total')
      .where('movement.companyId = :companyId', { companyId })
      .andWhere('movement.isActive = true')
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy("DATE_TRUNC('day', movement.createdAt)")
      .addGroupBy('movement.type')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      date: new Date(row.date).toISOString().slice(0, 10),
      type: row.type,
      total: Number(row.total),
    }));
  }

  async getAlerts(companyId: string) {
    const [lowStockProducts, outOfStockProducts] = await Promise.all([
      this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .where('product.companyId = :companyId', { companyId })
        .andWhere('product.isActive = true')
        .andWhere('product.stock > 0')
        .andWhere('product.stock <= product.minStock')
        .orderBy('product.stock', 'ASC')
        .limit(10)
        .getMany(),
      this.productRepository.find({
        where: { companyId, isActive: true, stock: 0 },
        relations: ['category'],
        take: 10,
      }),
    ]);

    return {
      lowStockProducts,
      outOfStockProducts,
    };
  }

  async getCategories(companyId: string) {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.products', 'product', 'product.isActive = true')
      .select('category.id', 'id')
      .addSelect('category.name', 'name')
      .addSelect('COUNT(product.id)', 'productsCount')
      .where('category.companyId = :companyId', { companyId })
      .andWhere('category.isActive = true')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('category.name', 'ASC')
      .getRawMany();

    return categories.map((item) => ({
      id: item.id,
      name: item.name,
      productsCount: Number(item.productsCount),
    }));
  }

  async getSummary(companyId: string) {
    const products = await this.productRepository.find({
      where: { companyId, isActive: true },
    });

    const totalStock = products.reduce((acc, product) => acc + Number(product.stock), 0);
    const totalValue = products.reduce(
      (acc, product) => acc + Number(product.stock) * Number(product.price),
      0,
    );
    const averagePrice = products.length ? totalValue / products.length : 0;

    return {
      totalStock,
      totalValue,
      averagePrice,
    };
  }
}
