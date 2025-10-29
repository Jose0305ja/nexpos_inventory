import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { MovementsService } from '../services/movements.service';

@Controller('inventory/movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  private extractCompanyId(req: Request & { companyId?: string }): string {
    return req.companyId as string;
  }

  @Get()
  async findAll(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const movements = await this.movementsService.findAll(companyId);
    return {
      message: 'Movements retrieved successfully',
      data: movements,
    };
  }

  @Get(':productId')
  async findByProduct(
    @Req() req: Request & { companyId?: string },
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const companyId = this.extractCompanyId(req);
    const movements = await this.movementsService.findByProduct(productId, companyId);
    return {
      message: 'Product movements retrieved successfully',
      data: movements,
    };
  }

  @Post()
  async create(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) createMovementDto: CreateMovementDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const movement = await this.movementsService.create(createMovementDto, companyId);
    return {
      message: 'Movement registered successfully',
      data: movement,
    };
  }
}
