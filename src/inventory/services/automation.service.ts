import { Injectable } from '@nestjs/common';
import { VoiceCommandDto, VoiceToActionDto } from '../dto/voice-command.dto';
import { UpdateRfidModeDto } from '../dto/update-rfid-mode.dto';
import { AuthenticatedUser } from '../../shared/guards/jwt-auth.guard';

@Injectable()
export class AutomationService {
  private readonly rfidState = new Map<string, boolean>();

  updateRfidMode(dto: UpdateRfidModeDto, user: AuthenticatedUser) {
    this.rfidState.set(user.companyId, dto.enabled);
    return { enabled: dto.enabled };
  }

  getRfidMode(user: AuthenticatedUser) {
    return { enabled: this.rfidState.get(user.companyId) ?? false };
  }

  processVoiceCommand(dto: VoiceCommandDto, user: AuthenticatedUser) {
    const command = dto.command.toLowerCase();
    let action = 'unknown';

    if (command.includes('reporte')) {
      action = 'generate_report';
    } else if (command.includes('inventario')) {
      action = 'open_inventory';
    } else if (command.includes('alerta')) {
      action = 'show_alerts';
    }

    return {
      companyId: user.companyId,
      action,
      command: dto.command,
    };
  }

  async voiceToAction(dto: VoiceToActionDto, user: AuthenticatedUser) {
    const normalized = dto.voiceInput.trim().toLowerCase();
    let action = 'no_action';

    if (normalized.includes('activar rfid')) {
      this.rfidState.set(user.companyId, true);
      action = 'rfid_enabled';
    } else if (normalized.includes('desactivar rfid')) {
      this.rfidState.set(user.companyId, false);
      action = 'rfid_disabled';
    }

    return {
      action,
      locale: dto.locale ?? 'es-ES',
    };
  }
}
