import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  KeyRound, 
  Camera, 
  Copy, 
  Check, 
  Wifi, 
  Bluetooth, 
  RefreshCw, 
  ArrowLeft, 
  Smartphone, 
  Laptop, 
  ShieldAlert, 
  Zap, 
  X,
  Cable,
  Usb,
  Cpu,
  Info,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { AccessoryType, DeviceRole, ConnectionProtocol } from '../types/sync';
import { syncEngine } from '../services/syncEngine';
import { webUsbService, UsbErrorDetails } from '../services/webUsbService';

interface PairingModalProps {
  role: DeviceRole;
  accessoryType?: AccessoryType;
  hostSessionCode?: string;
  onConnected: () => void;
  onBack: () => void;
  userId: string;
  onSessionCreated?: (code: string) => void;
  onProtocolChange?: (protocol: ConnectionProtocol) => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  role,
  accessoryType,
  hostSessionCode,
  onConnected,
  onBack,
  userId,
  onSessionCreated,
  onProtocolChange,
}) => {
  // Method tab: 'wireless' (Wi-Fi, QR, Cloud) or 'usb' (WebUSB Chrome / USB Cable)
  const [connectionTab, setConnectionTab] = useState<'wireless' | 'usb'>('wireless');

  // Host state
  const [sessionCode, setSessionCode] = useState<string>(hostSessionCode || '');
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Accessory state
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usbError, setUsbError] = useState<UsbErrorDetails | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);

  // USB diagnostics
  const usbDiagnostics = webUsbService.getDiagnostics();

  // Host: Generate session & QR code
  useEffect(() => {
    let isMounted = true;
    if (role === 'host') {
      const initHost = async () => {
        try {
          const dev = syncEngine.getDeviceInfo();
          const session = await syncEngine.createHostSession(userId, dev.name);
          if (isMounted) {
            setSessionCode(session.code);
            onSessionCreated?.(session.code);
            renderQrCode(session.code);
          }
        } catch (e) {
          console.error('Error creating host session:', e);
        }
      };
      initHost();
    }
    return () => {
      isMounted = false;
    };
  }, [role, userId]);

  const renderQrCode = async (code: string) => {
    if (!qrCanvasRef.current) return;
    try {
      const payload = JSON.stringify({
        app: 'syncpulse',
        code,
        url: window.location.origin,
      });
      await QRCode.toCanvas(qrCanvasRef.current, payload, {
        width: 200,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.warn('QR render error:', err);
    }
  };

  const handleCopyCode = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Connect via USB Cable (Chrome WebUSB API) with safe error parsing
  const handleConnectUsb = async () => {
    setLoading(true);
    setErrorMsg(null);
    setUsbError(null);

    // Pre-check if in iframe with blocked permissions policy
    if (usbDiagnostics.isIframe && !usbDiagnostics.policyAllowed) {
      setUsbError({
        type: 'PERMISSION_POLICY_BLOCKED',
        message: 'Acesso à porta USB desativado pela política de segurança deste painel (iframe).',
        isIframe: true,
        canOpenExternal: true,
        solution: 'Abra a aplicação em uma aba independente ou utilize a conexão Sem Fio (Wi-Fi / QR Code). Você também pode ativar Ancoragem USB nas configurações do celular.',
      });
      setLoading(false);
      return;
    }

    try {
      const dev = await webUsbService.requestUsbDevice();
      // Only proceed on real confirmed device connection
      if (dev && dev.connected) {
        onProtocolChange?.('usb_cable');
        onSessionCreated?.('USB-DIRECT');
        onConnected();
      }
    } catch (err: unknown) {
      const parsed = webUsbService.parseError(err);
      setUsbError(parsed);
      setErrorMsg(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  // Accessory: Connect with PIN
  const handleConnect = async (customPin?: string) => {
    const code = (customPin || pinInput).trim();
    if (code.length < 6) {
      setErrorMsg('Por favor, digite os 6 dígitos do código.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const dev = syncEngine.getDeviceInfo();
      await syncEngine.joinSessionByCode(code, userId, dev.name, accessoryType || 'all_in_one');
      onSessionCreated?.(code);
      onConnected();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao conectar. Verifique o código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Camera QR Scanner
  const startCameraScanner = async () => {
    setErrorMsg(null);
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      scannerStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera scanner access error:', err);
      setErrorMsg('Não foi possível acessar a câmera. Você pode digitar o código de 6 dígitos manualmente.');
      setShowScanner(false);
    }
  };

  const stopCameraScanner = () => {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    setShowScanner(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 select-none">
      {/* Top back button & role indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para escolha</span>
        </button>

        <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200">
          {role === 'host' ? 'Modo Receptor (PC)' : 'Modo Acessório (Celular)'}
        </span>
      </div>

      {/* Connection Type Tabs */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-slate-200 text-xs font-bold shadow-xs">
        <button
          onClick={() => { setConnectionTab('wireless'); setErrorMsg(null); setUsbError(null); }}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            connectionTab === 'wireless'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span>Sem Fio (Wi-Fi / QR Code)</span>
        </button>

        <button
          onClick={() => { setConnectionTab('usb'); setErrorMsg(null); }}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            connectionTab === 'usb'
              ? 'bg-cyan-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>Cabo USB (Chrome WebUSB)</span>
        </button>
      </div>

      {/* Generic Error Banner if not in USB tab */}
      {errorMsg && connectionTab !== 'usb' && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: CABO USB (WebUSB / Chrome) */}
      {connectionTab === 'usb' && (
        <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mx-auto shadow-sm">
            <Cable className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold">
              <Usb className="w-3 h-3" />
              <span>Tecnologia WebUSB do Chrome</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Conexão por Cabo USB</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Conecte seu celular ao PC por cabo. O Chrome permite comunicação direta com <strong>latência inferior a 1ms</strong>.
            </p>
          </div>

          {/* Detailed Error & Fallback Card if USB blocked or failed */}
          {usbError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left space-y-3 text-xs text-slate-700 animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-800 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">{usbError.message}</p>
                  <p className="text-xs text-amber-800/90 font-normal mt-1 leading-relaxed">
                    {usbError.solution}
                  </p>
                </div>
              </div>

              {/* Action Buttons inside error card */}
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  onClick={() => { setConnectionTab('wireless'); setUsbError(null); setErrorMsg(null); }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Usar Modo Sem Fio (Wi-Fi / QR Code)</span>
                </button>

                <button
                  onClick={handleConnectUsb}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

          {/* USB Device Button (Disabled or Active) */}
          <div className="max-w-md mx-auto space-y-2">
            <button
              onClick={handleConnectUsb}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando ao dispositivo USB...</span>
                </>
              ) : (
                <>
                  <Usb className="w-4 h-4" />
                  <span>Detectar Dispositivo USB pelo Chrome</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500">
              O Chrome exibirá uma janela do navegador para selecionar o dispositivo conectado.
            </p>
          </div>

          {/* USB Tethering Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center gap-1.5 text-cyan-700 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Alternativa Cabeada: Ancoragem USB (Tethering)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Você pode ativar a <strong>Ancoragem USB</strong> nas configurações de rede do seu celular. Isso cria uma conexão de rede cabeada direta de alta velocidade sem nenhuma restrição de navegador!
            </p>
          </div>

          {/* Quick switch back button */}
          <div className="pt-1">
            <button
              onClick={() => { setConnectionTab('wireless'); setUsbError(null); }}
              className="text-xs font-semibold text-cyan-700 hover:underline"
            >
              ← Voltar para Pareamento Sem Fio (Wi-Fi / QR Code)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: WIRELESS (Wi-Fi / QR Code / Nuvem) */}
      {connectionTab === 'wireless' && (
        <>
          {/* HOST VIEW */}
          {role === 'host' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-center">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Pronto para Conectar</h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  No seu celular ou acessório, escaneie o QR Code ou digite o código PIN abaixo.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-xs mx-auto">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  <canvas ref={qrCanvasRef} className="rounded w-44 h-44" />
                </div>
                <p className="text-[11px] text-slate-500 mt-2.5 flex items-center gap-1 font-medium">
                  <QrCode className="w-3 h-3 text-cyan-600" />
                  <span>Aponte a câmera do celular para este código</span>
                </p>
              </div>

              {/* PIN Code Box */}
              <div className="space-y-1.5 max-w-xs mx-auto">
                <label className="text-[11px] font-semibold text-slate-600 block">Ou digite o código PIN no celular:</label>
                <div className="flex items-center justify-center gap-2">
                  <div className="font-mono text-2xl font-extrabold tracking-widest px-5 py-2 rounded-xl bg-slate-100 border border-cyan-200 text-cyan-800 shadow-inner">
                    {sessionCode ? `${sessionCode.slice(0, 3)} ${sessionCode.slice(3)}` : '••••••'}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                    title="Copiar Código"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Network Status Info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-left text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-700">
                    <Wifi className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-[11px]">Rede Local (LAN)</p>
                    <p className="text-[10px] text-slate-500">Descoberta Wi-Fi Ativa</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Bluetooth className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-[11px]">Canal P2P / Nuvem</p>
                    <p className="text-[10px] text-slate-500">WebRTC + Firebase</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Aguardando o celular se conectar...</span>
              </div>
            </div>
          )}

          {/* ACCESSORY VIEW */}
          {role === 'accessory' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Conectar ao Computador / PC</h2>
                <p className="text-xs text-slate-600">
                  Digite o código de 6 dígitos mostrado na tela do PC ou escaneie o QR Code.
                </p>
              </div>

              {/* Quick scan button */}
              <button
                onClick={startCameraScanner}
                className="w-full py-3 px-4 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Camera className="w-4 h-4 text-cyan-600" />
                <span>Escanear QR Code com a Câmera</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold absolute">
                  ou digite o código PIN
                </span>
              </div>

              {/* PIN Input */}
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 123456"
                    className="w-full text-center font-mono text-2xl font-extrabold tracking-widest py-2.5 bg-slate-50 border border-slate-300 focus:border-cyan-600 rounded-xl text-slate-900 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  onClick={() => handleConnect()}
                  disabled={loading || pinInput.length < 6}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Conectar Agora</span>
                    </>
                  )}
                </button>
              </div>

              {/* Camera Scanner Viewport Modal */}
              {showScanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-center shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-cyan-600" />
                        Escanear QR Code
                      </span>
                      <button onClick={stopCameraScanner} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-black aspect-square border-2 border-cyan-500/50 flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-8 border-2 border-dashed border-cyan-400 rounded-lg pointer-events-none animate-pulse" />
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Posicione o QR Code exibido no computador dentro do quadrado pontilhado.
                    </p>

                    <button
                      onClick={stopCameraScanner}
                      className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
