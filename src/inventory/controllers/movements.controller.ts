import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MovementsService } from '../services/movements.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { buildResponse } from '../../shared/utils/response.helper';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: 'admin' | 'employee';
    companyId: string;
  };
}

@Controller('inventory/movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const data = await this.movementsService.findAll(req.user.companyId);
    return buildResponse('Movimientos obtenidos correctamente', data);
  }

  @Get(':productId')
  async findByProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    const data = await this.movementsService.findByProduct(
      req.user.companyId,
      productId,
    );
    return buildResponse('Movimientos del producto obtenidos', data);
  }

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createMovementDto: CreateMovementDto,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'employee') {
      throw new ForbiddenException({ message: 'Acción no permitida' });
    }

    const data = await this.movementsService.create(
      req.user.companyId,
      createMovementDto,
    );
    return buildResponse('Movimiento registrado correctamente', data);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException({ message: 'Acción no permitida' });
    }

    const data = await this.movementsService.remove(req.user.companyId, id);
    return buildResponse('Movimiento eliminado correctamente', data);
  }
}
