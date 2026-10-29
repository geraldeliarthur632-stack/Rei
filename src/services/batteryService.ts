import { syncEngine } from './syncEngine';

class BatteryService {
  private batteryManager: any = null;
  private intervalId: number | null = null;
  private currentLevel: number = 85;
  private currentCharging: boolean = false;
  private isListening: boolean = false;

  public async startMonitoring() {
    if (this.isListening) return;
    this.isListening = true;

    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        this.batteryManager = await (navigator as any).getBattery();
        this.updateFromBatteryManager();

        // Listen for live battery state updates
        this.batteryManager.addEventListener('levelchange', () => {
          this.updateFromBatteryManager();
        });

        this.batteryManager.addEventListener('chargingchange', () => {
          this.updateFromBatteryManager();
        });
      } else {
        // Fallback for browsers without Battery API (e.g., iOS Safari)
        // Send initial baseline
        this.sendUpdate(this.currentLevel, this.currentCharging);
      }
    } catch (e) {
      console.warn('Battery API not supported or restricted, using fallback monitor:', e);
      this.sendUpdate(this.currentLevel, this.currentCharging);
    }

    // Periodic heartbeat to keep HostScreen battery state fresh
    this.intervalId = window.setInterval(() => {
      if (this.batteryManager) {
        this.updateFromBatteryManager();
      } else {
        this.sendUpdate(this.currentLevel, this.currentCharging);
      }
    }, 15000);
  }

  private updateFromBatteryManager() {
    if (!this.batteryManager) return;
    const level = Math.round(this.batteryManager.level * 100);
    const isCharging = Boolean(this.batteryManager.charging);
    this.currentLevel = level;
    this.currentCharging = isCharging;
    this.sendUpdate(level, isCharging);
  }

  private sendUpdate(level: number, isCharging: boolean) {
    syncEngine.sendBatteryUpdate(level, isCharging);
  }

  public setManualLevel(level: number, isCharging: boolean) {
    this.currentLevel = Math.max(1, Math.min(100, level));
    this.currentCharging = isCharging;
    this.sendUpdate(this.currentLevel, this.currentCharging);
  }

  public stopMonitoring() {
    this.isListening = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const batteryService = new BatteryService();
