import { Controller, Get } from '@nestjs/common';
import { buildResponse } from '../../shared/utils/response.helper';

@Controller('inventory')
export class HealthController {
  @Get('health')
  health() {
    return buildResponse('Servicio de inventario operativo', {
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }
}
