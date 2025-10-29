import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { buildResponse } from '../../shared/utils/response.helper';

interface AuthenticatedRequest extends Request {
  user: {
    companyId: string;
    role: 'admin' | 'employee';
    userId: string;
  };
}

@Controller('inventory/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getOverview(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getOverview(req.user.companyId);
    return buildResponse('Dashboard cargado correctamente', data);
  }

  @Get('trends')
  async getTrends(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getTrends(req.user.companyId);
    return buildResponse('Tendencias obtenidas correctamente', data);
  }

  @Get('alerts')
  async getAlerts(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getAlerts(req.user.companyId);
    return buildResponse('Alertas obtenidas correctamente', data);
  }

  @Get('categories')
  async getCategorySummary(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getCategorySummary(
      req.user.companyId,
    );
    return buildResponse('Resumen por categoría obtenido', data);
  }

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    const data = await this.dashboardService.getSummary(req.user.companyId);
    return buildResponse('Resumen obtenido correctamente', data);
  }
}
