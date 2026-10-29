/**
 * SincroPulso Universal Permissions Service
 * Handles all browser, hardware, and sensor permissions for:
 * - Phone to PC
 * - Phone to Phone (Celular para Celular)
 */

export interface PermissionStatusSummary {
  motion: boolean | 'prompt' | 'denied';
  microphone: boolean | 'prompt' | 'denied';
  camera: boolean | 'prompt' | 'denied';
  wakeLock: boolean;
  vibration: boolean;
  webAudio: boolean;
  clipboard: boolean;
}

class PermissionsService {
  private wakeLockSentinel: any = null;
  private audioContextUnlocked = false;

  /**
   * Request Gyroscope & Motion Sensors (Crucial for Air Mouse & 3D Pointer)
   * Specifically handles iOS 13+ requirement of DeviceOrientationEvent.requestPermission()
   */
  async requestMotionSensors(): Promise<boolean> {
    try {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        return permissionState === 'granted';
      }
      // On Android / desktop browsers where permission is automatic
      return 'DeviceOrientationEvent' in window;
    } catch (e) {
      console.warn('Motion permission request error:', e);
      return false;
    }
  }

  /**
   * Request Microphone (WebRTC audio / Walkie-talkie / Remote Mic)
   */
  async requestMicrophone(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Microphone permission request error:', e);
      return false;
    }
  }

  /**
   * Request Camera (for QR Code scanning on phone screens)
   */
  async requestCamera(): Promise<boolean> {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Camera permission request error:', e);
      return false;
    }
  }

  /**
   * Screen Wake Lock API
   * Keeps phone display permanently ON during control sessions
   * (Crucial for Celular para Celular and Celular para PC so screen doesn't turn black)
   */
  async requestWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Wake Lock request error:', e);
      return false;
    }
  }

  releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch (e) {
        // Ignored
      }
    }
  }

  /**
   * Haptic vibration feedback for physical click feel
   */
  triggerHaptic(durationMs = 15): void {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(durationMs);
      } catch (e) {
        // Ignored
      }
    }
  }

  /**
   * Unlock Web Audio Context on user gesture
   * iOS & Chrome require user gesture before allowing audio playback
   */
  unlockWebAudio(): boolean {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        this.audioContextUnlocked = true;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Toggle Fullscreen Mode
   * Lets phones hide browser navigation bars for full touchpad / keyboard experience
   */
  async toggleFullscreen(element?: HTMLElement): Promise<boolean> {
    const target = element || document.documentElement;
    try {
      if (!document.fullscreenElement) {
        if (target.requestFullscreen) {
          await target.requestFullscreen();
          return true;
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen();
          return true;
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return false;
        }
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
    return false;
  }

  /**
   * Cross-device Clipboard copy
   */
  async copyText(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.triggerHaptic(20);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Request ALL permissions in one unified flow
   */
  async requestAllPermissions(): Promise<{
    motion: boolean;
    camera: boolean;
    microphone: boolean;
    wakeLock: boolean;
  }> {
    this.unlockWebAudio();
    this.triggerHaptic(25);

    const [motion, camera, microphone, wakeLock] = await Promise.all([
      this.requestMotionSensors(),
      this.requestCamera(),
      this.requestMicrophone(),
      this.requestWakeLock(),
    ]);

    localStorage.setItem('sincropulso_permissions_reviewed', 'true');

    return { motion, camera, microphone, wakeLock };
  }
}

export const permissionsService = new PermissionsService();
