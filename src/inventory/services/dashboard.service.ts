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

  async getOverview(companyId: string) {
    const products = await this.productRepository.find({
      where: { companyId, isActive: true },
    });

    const totalProducts = products.length;
    const lowStock = products.filter((product) => product.stock <= product.minStock)
      .length;
    const outOfStock = products.filter((product) => product.stock === 0).length;
    const totalStock = products.reduce((acc, product) => acc + product.stock, 0);
    const inventoryValue = products.reduce(
      (acc, product) => acc + Number(product.price) * product.stock,
      0,
    );

    return {
      totalProducts,
      totalStock,
      lowStock,
      outOfStock,
      inventoryValue,
    };
  }

  async getTrends(companyId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const movements = await this.movementRepository.find({
      where: { companyId, isActive: true },
      relations: ['product'],
      order: { createdAt: 'ASC' },
    });

    const filtered = movements.filter((movement) => movement.createdAt >= since);

    const trendMap = filtered.reduce<Record<string, { in: number; out: number }>>(
      (acc, movement) => {
        const day = movement.createdAt.toISOString().slice(0, 10);
        if (!acc[day]) {
          acc[day] = { in: 0, out: 0 };
        }

        acc[day][movement.type] += movement.quantity;
        return acc;
      },
      {},
    );

    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toISOString().slice(0, 10);
    });

    return days.map((day) => ({
      date: day,
      in: trendMap[day]?.in ?? 0,
      out: trendMap[day]?.out ?? 0,
    }));
  }

  async getAlerts(companyId: string) {
    const products = await this.productRepository.find({
      where: { companyId, isActive: true },
      relations: ['category'],
    });

    return {
      lowStock: products.filter((product) => product.stock <= product.minStock),
      outOfStock: products.filter((product) => product.stock === 0),
    };
  }

  async getCategorySummary(companyId: string) {
    const categories = await this.categoryRepository.find({
      where: { companyId, isActive: true },
      relations: ['products'],
    });

    return categories.map((category) => {
      const activeProducts = category.products?.filter(
        (product) => product.isActive,
      );
      const totalStock = activeProducts?.reduce(
        (acc, product) => acc + product.stock,
        0,
      );
      return {
        categoryId: category.id,
        name: category.name,
        products: activeProducts?.length ?? 0,
        stock: totalStock ?? 0,
      };
    });
  }

  async getSummary(companyId: string) {
    const [overview, alerts, movements] = await Promise.all([
      this.getOverview(companyId),
      this.getAlerts(companyId),
      this.movementRepository.count({
        where: { companyId, isActive: true },
      }),
    ]);

    return {
      ...overview,
      alerts,
      totalMovements: movements,
    };
  }
}
