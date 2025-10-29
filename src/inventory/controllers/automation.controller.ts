import { Body, Controller, Get, Patch, Post, Req, ForbiddenException } from '@nestjs/common';
import { AutomationService } from '../services/automation.service';
import { UpdateRfidModeDto } from '../dto/update-rfid-mode.dto';
import { VoiceCommandDto, VoiceToActionDto } from '../dto/voice-command.dto';
import { ResponseHelper } from '../../shared/utils/response.helper';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../shared/interfaces/auth-request.interface';

@Controller('inventory')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Patch('rfid-mode')
  async updateRfidMode(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRfidModeDto,
  ) {
    const { user } = req;
    this.ensureAdmin(user);
    const data = this.automationService.updateRfidMode(dto, user);
    return ResponseHelper.success('Modo RFID actualizado correctamente', data);
  }

  @Get('rfid-mode')
  async getRfidMode(@Req() req: AuthenticatedRequest) {
    const { user } = req;
    const data = this.automationService.getRfidMode(user);
    return ResponseHelper.success('Estado de RFID obtenido correctamente', data);
  }

  @Post('voice-command')
  async voiceCommand(@Req() req: AuthenticatedRequest, @Body() dto: VoiceCommandDto) {
    const { user } = req;
    const data = this.automationService.processVoiceCommand(dto, user);
    return ResponseHelper.success('Comando de voz procesado', data);
  }

  @Post('voice-to-action')
  async voiceToAction(@Req() req: AuthenticatedRequest, @Body() dto: VoiceToActionDto) {
    const { user } = req;
    const data = await this.automationService.voiceToAction(dto, user);
    return ResponseHelper.success('Acción de voz procesada', data);
  }

  private ensureAdmin(user: AuthenticatedUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException({ message: 'Acceso restringido a administradores' });
    }
  }
}
