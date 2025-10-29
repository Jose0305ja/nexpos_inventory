import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from '../services/dashboard.service';

@Controller('inventory/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private extractCompanyId(req: Request & { companyId?: string }): string {
    return req.companyId as string;
  }

  @Get()
  async getOverview(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const overview = await this.dashboardService.getOverview(companyId);
    return {
      message: 'Dashboard overview generated successfully',
      data: overview,
    };
  }

  @Get('alerts')
  async getAlerts(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const alerts = await this.dashboardService.getAlerts(companyId);
    return {
      message: 'Low stock alerts generated successfully',
      data: alerts,
    };
  }

  @Get('trends')
  async getTrends(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const trends = await this.dashboardService.getTrends(companyId);
    return {
      message: 'Inventory trends generated successfully',
      data: trends,
    };
  }
}
