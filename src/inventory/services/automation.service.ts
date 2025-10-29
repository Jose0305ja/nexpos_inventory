import { Injectable } from '@nestjs/common';

interface AutomationState {
  rfidEnabled: boolean;
}

@Injectable()
export class AutomationService {
  private readonly state = new Map<string, AutomationState>();

  setRfidMode(companyId: string, enabled: boolean) {
    const current = this.state.get(companyId) ?? { rfidEnabled: false };
    current.rfidEnabled = enabled;
    this.state.set(companyId, current);
    return { rfidEnabled: current.rfidEnabled };
  }

  getRfidMode(companyId: string) {
    return this.state.get(companyId) ?? { rfidEnabled: false };
  }

  processVoiceCommand(companyId: string, command: string) {
    const normalized = command.trim().toLowerCase();

    if (normalized.includes('activar rfid') || normalized.includes('enable rfid')) {
      return {
        message: 'RFID mode enabled via voice command',
        data: this.setRfidMode(companyId, true),
      };
    }

    if (normalized.includes('desactivar rfid') || normalized.includes('disable rfid')) {
      return {
        message: 'RFID mode disabled via voice command',
        data: this.setRfidMode(companyId, false),
      };
    }

    return {
      message: 'Command received',
      data: { command },
    };
  }

  voiceToAction(companyId: string, command: string) {
    const response = this.processVoiceCommand(companyId, command);

    if (response.message.startsWith('RFID mode')) {
      return response;
    }

    if (command.toLowerCase().includes('inventario') || command.toLowerCase().includes('stock')) {
      return {
        message: 'Inventory summary requested via voice',
        data: {
          action: 'dashboard.summary',
        },
      };
    }

    return {
      message: 'No automation action mapped for command',
      data: { command },
    };
  }
}
