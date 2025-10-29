import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AutomationService } from '../services/automation.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { buildResponse } from '../../shared/utils/response.helper';
import { VoiceCommandDto } from '../dto/voice-command.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: 'admin' | 'employee';
    companyId: string;
  };
}

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Patch('rfid-mode')
  async toggleRfid(@Req() req: AuthenticatedRequest) {
    this.ensureAdmin(req.user.role);
    const data = this.automationService.toggleRfidMode(req.user.companyId);
    return buildResponse('Modo RFID actualizado correctamente', data);
  }

  @Get('rfid-mode')
  async getRfid(@Req() req: AuthenticatedRequest) {
    const data = this.automationService.getRfidMode(req.user.companyId);
    return buildResponse('Modo RFID obtenido correctamente', data);
  }

  @Post('voice-command')
  async processVoiceCommand(
    @Req() req: AuthenticatedRequest,
    @Body() voiceCommandDto: VoiceCommandDto,
  ) {
    const data = this.automationService.processVoiceCommand(
      req.user.companyId,
      voiceCommandDto,
    );
    return buildResponse('Comando de voz procesado', data);
  }

  @Post('voice-to-action')
  async processVoiceToAction(
    @Req() req: AuthenticatedRequest,
    @Body() voiceCommandDto: VoiceCommandDto,
  ) {
    const data = this.automationService.processVoiceToAction(
      req.user.companyId,
      voiceCommandDto,
    );
    return buildResponse('Acción generada desde voz', data);
  }

  private ensureAdmin(role: 'admin' | 'employee') {
    if (role !== 'admin') {
      throw new ForbiddenException({ message: 'Acción no permitida' });
    }
  }
}
