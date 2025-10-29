import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VoiceCommandDto } from '../dto/voice-command.dto';
import { AutomationService } from '../services/automation.service';

class ToggleRfidDto {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return Boolean(value);
  })
  @IsBoolean()
  enabled: boolean;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  private extractCompanyId(req: Request & { companyId?: string }): string {
    return req.companyId as string;
  }

  @Patch('rfid-mode')
  async toggleRfid(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) toggleRfidDto: ToggleRfidDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const state = this.automationService.setRfidMode(companyId, toggleRfidDto.enabled);
    return {
      message: `RFID mode ${toggleRfidDto.enabled ? 'enabled' : 'disabled'} successfully`,
      data: state,
    };
  }

  @Get('rfid-mode')
  async getRfidMode(@Req() req: Request & { companyId?: string }) {
    const companyId = this.extractCompanyId(req);
    const state = this.automationService.getRfidMode(companyId);
    return {
      message: 'RFID mode retrieved successfully',
      data: state,
    };
  }

  @Post('voice-command')
  async voiceCommand(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) voiceCommandDto: VoiceCommandDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const response = this.automationService.processVoiceCommand(companyId, voiceCommandDto.command);
    return response;
  }

  @Post('voice-to-action')
  async voiceToAction(
    @Req() req: Request & { companyId?: string },
    @Body(new ValidationPipe({ transform: true })) voiceCommandDto: VoiceCommandDto,
  ) {
    const companyId = this.extractCompanyId(req);
    const response = this.automationService.voiceToAction(companyId, voiceCommandDto.command);
    return response;
  }
}
