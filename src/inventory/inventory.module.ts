import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AutomationController } from './controllers/automation.controller';
import { CategoriesController } from './controllers/categories.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { MovementsController } from './controllers/movements.controller';
import { ProductsController } from './controllers/products.controller';
import { Category } from './entities/category.entity';
import { Movement } from './entities/movement.entity';
import { Product } from './entities/product.entity';
import { AutomationService } from './services/automation.service';
import { CategoriesService } from './services/categories.service';
import { DashboardService } from './services/dashboard.service';
import { MovementsService } from './services/movements.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Movement])],
  controllers: [ProductsController, CategoriesController, MovementsController, DashboardController, AutomationController],
  providers: [ProductsService, CategoriesService, MovementsService, DashboardService, AutomationService, JwtAuthGuard],
})
export class InventoryModule {}
