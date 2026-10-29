export interface UsbDeviceInfo {
  productName?: string;
  manufacturerName?: string;
  serialNumber?: string;
  vendorId?: number;
  productId?: number;
  connected: boolean;
}

export type UsbErrorType = 
  | 'NOT_SUPPORTED'
  | 'PERMISSION_POLICY_BLOCKED'
  | 'NOT_IN_STANDALONE'
  | 'USER_CANCELLED'
  | 'ACCESS_DENIED'
  | 'UNKNOWN';

export interface UsbErrorDetails {
  type: UsbErrorType;
  message: string;
  isIframe: boolean;
  canOpenExternal: boolean;
  solution: string;
}

class WebUsbService {
  private device: any = null;

  public checkSupport(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
  }

  public isInsideIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  public isPolicyAllowed(): boolean {
    if (!this.checkSupport()) return false;
    try {
      const doc = document as any;
      if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
        return doc.featurePolicy.allowsFeature('usb');
      }
      if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
        return doc.permissionsPolicy.allowsFeature('usb');
      }
    } catch {
      // Ignore
    }
    return true; // Default assumption until requestDevice is invoked
  }

  public getDiagnostics(): {
    isSupported: boolean;
    isIframe: boolean;
    policyAllowed: boolean;
    externalUrl: string;
  } {
    const isSupported = this.checkSupport();
    const isIframe = this.isInsideIframe();
    const policyAllowed = this.isPolicyAllowed();
    const externalUrl = typeof window !== 'undefined' ? window.location.href : '';

    return {
      isSupported,
      isIframe,
      policyAllowed,
      externalUrl,
    };
  }

  public parseError(err: unknown): UsbErrorDetails {
    const isIframe = this.isInsideIframe();
    const rawMsg = err instanceof Error ? err.message : String(err);
    const errName = err instanceof DOMException ? err.name : (err as any)?.name || '';

    if (!this.checkSupport()) {
      return {
        type: 'NOT_SUPPORTED',
        message: 'A tecnologia WebUSB não está disponível neste navegador.',
        isIframe,
        canOpenExternal: false,
        solution: 'Abra este aplicativo no Google Chrome, Microsoft Edge ou Brave em um computador desktop ou celular Android.',
      };
    }

    if (
      errName === 'SecurityError' ||
      rawMsg.toLowerCase().includes('permissions policy') ||
      rawMsg.toLowerCase().includes('disallowed by permissions policy')
    ) {
      return {
        type: 'PERMISSION_POLICY_BLOCKED',
        message: 'O acesso ao WebUSB foi bloqueado pela política de permissão do navegador (Permissions Policy).',
        isIframe,
        canOpenExternal: isIframe,
        solution: isIframe
          ? 'O ambiente de pré-visualização (iframe) bloqueia o acesso direto à porta USB por segurança. Você pode usar a conexão Sem Fio (Wi-Fi / QR Code) imediatamente, ou ativar Ancoragem USB nas configurações do celular.'
          : 'A política do servidor restringiu a API USB neste domínio. Utilize a conexão sem fio Wi-Fi LAN / QR Code de alta velocidade.',
      };
    }

    if (
      errName === 'NotFoundError' ||
      rawMsg.includes('No device selected') ||
      rawMsg.includes('cancelled')
    ) {
      return {
        type: 'USER_CANCELLED',
        message: 'Nenhum dispositivo USB foi selecionado na janela de diálogo.',
        isIframe,
        canOpenExternal: false,
        solution: 'Clique novamente e selecione o seu aparelho na lista do Chrome, ou certifique-se de que o cabo USB esteja firme.',
      };
    }

    if (errName === 'NotAllowedError') {
      return {
        type: 'ACCESS_DENIED',
        message: 'Permissão para acessar o dispositivo USB negada pelo usuário ou sistema.',
        isIframe,
        canOpenExternal: false,
        solution: 'Permita o acesso quando o Chrome solicitar ou use o modo Sem Fio.',
      };
    }

    return {
      type: 'UNKNOWN',
      message: `Erro ao conectar via USB: ${rawMsg}`,
      isIframe,
      canOpenExternal: isIframe,
      solution: 'Tente reconectar o cabo USB ou utilize a conexão sem fio recomendada.',
    };
  }

  public async requestUsbDevice(): Promise<UsbDeviceInfo> {
    if (!this.checkSupport()) {
      throw new Error(
        'A tecnologia WebUSB não está disponível neste navegador. Use o Google Chrome, Edge ou Brave.'
      );
    }

    // Check if feature policy explicitly disallows before calling
    if (!this.isPolicyAllowed() && this.isInsideIframe()) {
      throw new DOMException(
        'Access to the feature "usb" is disallowed by permissions policy in this preview frame.',
        'SecurityError'
      );
    }

    try {
      const usb = (navigator as any).usb;
      const device = await usb.requestDevice({
        filters: [], // Shows all available USB devices
      });

      this.device = device;
      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      return {
        productName: device.productName || 'Dispositivo USB Conectado',
        manufacturerName: device.manufacturerName || 'Dispositivo Compatível',
        serialNumber: device.serialNumber || 'N/A',
        vendorId: device.vendorId,
        productId: device.productId,
        connected: true,
      };
    } catch (err) {
      throw err;
    }
  }

  public async sendUsbData(data: string): Promise<boolean> {
    if (!this.device || !this.device.opened) return false;
    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      await this.device.transferOut(1, bytes);
      return true;
    } catch (e) {
      console.warn('USB transferOut failed:', e);
      return false;
    }
  }

  public async disconnect() {
    if (this.device && this.device.opened) {
      try {
        await this.device.close();
      } catch (e) {
        console.warn('USB close error:', e);
      }
    }
    this.device = null;
  }
}

export const webUsbService = new WebUsbService();
