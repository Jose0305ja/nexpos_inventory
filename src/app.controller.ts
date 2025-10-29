import { Controller, Get } from '@nestjs/common';
import { ResponseHelper } from './shared/utils/response.helper';
import { Public } from './shared/guards/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get('inventory/health')
  health() {
    return ResponseHelper.success('Servicio de inventario en ejecución', {
      status: 'ok',
    });
  }
}
