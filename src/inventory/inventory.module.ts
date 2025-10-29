import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Movement } from './entities/movement.entity';
import { ProductsService } from './services/products.service';
import { CategoriesService } from './services/categories.service';
import { MovementsService } from './services/movements.service';
import { DashboardService } from './services/dashboard.service';
import { AutomationService } from './services/automation.service';
import { ProductsController } from './controllers/products.controller';
import { CategoriesController } from './controllers/categories.controller';
import { MovementsController } from './controllers/movements.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { AutomationController } from './controllers/automation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Movement])],
  controllers: [
    ProductsController,
    CategoriesController,
    MovementsController,
    DashboardController,
    AutomationController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    MovementsService,
    DashboardService,
    AutomationService,
  ],
})
export class InventoryModule {}
