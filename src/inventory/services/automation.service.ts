import { Injectable } from '@nestjs/common';
import { VoiceCommandDto } from '../dto/voice-command.dto';

interface VoiceActionResponse {
  action: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class AutomationService {
  private readonly rfidModes = new Map<string, boolean>();
  private readonly voiceLogs = new Map<string, string[]>();

  toggleRfidMode(companyId: string) {
    const current = this.rfidModes.get(companyId) ?? false;
    const updated = !current;
    this.rfidModes.set(companyId, updated);
    return { enabled: updated };
  }

  getRfidMode(companyId: string) {
    const enabled = this.rfidModes.get(companyId) ?? false;
    return { enabled };
  }

  processVoiceCommand(companyId: string, voiceCommandDto: VoiceCommandDto) {
    this.appendVoiceLog(companyId, voiceCommandDto.command);

    return {
      command: voiceCommandDto.command,
      status: 'received',
      suggestions: this.generateSuggestions(voiceCommandDto.command),
    };
  }

  processVoiceToAction(companyId: string, voiceCommandDto: VoiceCommandDto) {
    this.appendVoiceLog(companyId, voiceCommandDto.command);

    const normalized = voiceCommandDto.command.toLowerCase();
    const response: VoiceActionResponse = { action: 'none' };

    if (normalized.includes('agregar') || normalized.includes('registrar')) {
      response.action = 'create_product';
    } else if (normalized.includes('actualizar stock')) {
      response.action = 'adjust_stock';
      response.payload = { type: 'in' };
    } else if (normalized.includes('descontar') || normalized.includes('vender')) {
      response.action = 'adjust_stock';
      response.payload = { type: 'out' };
    }

    return {
      command: voiceCommandDto.command,
      action: response.action,
      payload: response.payload ?? null,
    };
  }

  private appendVoiceLog(companyId: string, command: string) {
    const history = this.voiceLogs.get(companyId) ?? [];
    history.push(command);
    this.voiceLogs.set(companyId, history.slice(-20));
  }

  private generateSuggestions(command: string) {
    const normalized = command.toLowerCase();
    const suggestions: string[] = [];

    if (normalized.includes('agregar') || normalized.includes('producto')) {
      suggestions.push('¿Deseas crear un nuevo producto?');
    }

    if (normalized.includes('stock') || normalized.includes('inventario')) {
      suggestions.push('Puedes decir "actualizar stock del producto"');
    }

    if (normalized.includes('alerta')) {
      suggestions.push('Consulta las alertas de inventario en el dashboard');
    }

    return suggestions;
  }
}
