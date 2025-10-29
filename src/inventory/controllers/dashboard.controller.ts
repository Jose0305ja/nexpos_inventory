import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { ResponseHelper } from '../../shared/utils/response.helper';
import type { AuthenticatedRequest } from '../../shared/interfaces/auth-request.interface';

@Controller('inventory/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = await this.dashboardService.getDashboard(user.companyId);
    return ResponseHelper.success('Dashboard obtenido correctamente', data);
  }

  @Get('trends')
  async getTrends(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = await this.dashboardService.getTrends(user.companyId);
    return ResponseHelper.success('Tendencias obtenidas correctamente', data);
  }

  @Get('alerts')
  async getAlerts(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = await this.dashboardService.getAlerts(user.companyId);
    return ResponseHelper.success('Alertas obtenidas correctamente', data);
  }

  @Get('categories')
  async getCategories(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = await this.dashboardService.getCategories(user.companyId);
    return ResponseHelper.success('Categorías de dashboard obtenidas', data);
  }

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = await this.dashboardService.getSummary(user.companyId);
    return ResponseHelper.success('Resumen obtenido correctamente', data);
  }
}
