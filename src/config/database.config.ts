import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Product } from '../inventory/entities/product.entity';
import { Category } from '../inventory/entities/category.entity';
import { Movement } from '../inventory/entities/movement.entity';

export const getDatabaseConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_HOST'),
  port: Number(config.get<number>('DB_PORT')),
  username: config.get<string>('DB_USER'),
  password: config.get<string>('DB_PASS'),
  database: config.get<string>('DB_NAME'),
  entities: [Product, Category, Movement],
  synchronize: true,
});
