import { Body, Controller, Delete, Get, Param, Post, Req, ForbiddenException } from '@nestjs/common';
import { MovementsService } from '../services/movements.service';
import { CreateMovementDto } from '../dto/create-movement.dto';
import { ResponseHelper } from '../../shared/utils/response.helper';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../shared/interfaces/auth-request.interface';

@Controller('inventory/movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const movements = await this.movementsService.findAll(user.companyId);
    return ResponseHelper.success('Movimientos obtenidos correctamente', movements);
  }

  @Get(':productId')
  async findByProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    const { user } = req;
    const movements = await this.movementsService.findByProduct(productId, user.companyId);
    return ResponseHelper.success('Movimientos del producto obtenidos correctamente', movements);
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateMovementDto) {
    const { user } = req;
    const movement = await this.movementsService.create(dto, user);
    return ResponseHelper.success('Movimiento registrado correctamente', movement);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const { user } = req;
    this.ensureAdmin(user);
    await this.movementsService.remove(id, user);
    return ResponseHelper.success('Movimiento eliminado correctamente');
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException({ message: 'Acceso restringido a administradores' });
    }
  }
}
