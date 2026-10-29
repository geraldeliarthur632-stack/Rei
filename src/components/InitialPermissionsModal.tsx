import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Compass, 
  Camera, 
  Volume2, 
  Vibrate, 
  Check, 
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

interface InitialPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted?: () => void;
}

export const InitialPermissionsModal: React.FC<InitialPermissionsModalProps> = ({
  isOpen,
  onClose,
  onPermissionsGranted,
}) => {
  const [requesting, setRequesting] = useState(false);
  const [grantedSensors, setGrantedSensors] = useState<boolean | null>(null);
  const [grantedCamera, setGrantedCamera] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleRequestAllPermissions = async () => {
    setRequesting(true);

    // 1. Motion Sensors (iOS requires user gesture DeviceOrientationEvent.requestPermission)
    try {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        setGrantedSensors(res === 'granted');
      } else {
        setGrantedSensors(true);
      }
    } catch (e) {
      console.warn('Sensors permission request error:', e);
      setGrantedSensors(false);
    }

    // 2. Camera for QR Code
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Release immediately once permission granted
        stream.getTracks().forEach((track) => track.stop());
        setGrantedCamera(true);
      }
    } catch (e) {
      console.warn('Camera permission request error:', e);
      setGrantedCamera(false);
    }

    // Mark as reviewed
    localStorage.setItem('sincropulso_permissions_reviewed', 'true');
    setRequesting(false);
    onPermissionsGranted?.();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleSkipOrBasic = () => {
    localStorage.setItem('sincropulso_permissions_reviewed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-left space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Permissões do Dispositivo
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Seguro
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ative os recursos para integração em tempo real com baixa latência
              </p>
            </div>
          </div>
          <button
            onClick={handleSkipOrBasic}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions List */}
        <div className="space-y-2.5">
          {/* Permission 1: Giroscópio */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Sensores de Movimento & Giroscópio</span>
                {grantedSensors === true && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Ativo</span>}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Permite mover o cursor do computador no ar movendo o celular como ponteiro 3D, ou usar como Touchpad de precisão.
              </p>
            </div>
          </div>

          {/* Permission 2: Câmera QR */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Câmera (Leitor de QR Code)</span>
                {grantedCamera === true && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Ativo</span>}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Escaneia o QR Code na tela do computador para conectar em 1 segundo sem precisar digitar o código PIN de 6 dígitos.
              </p>
            </div>
          </div>

          {/* Permission 3: Áudio e Sons */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs flex-1">
              <span className="font-bold text-slate-800">Áudio & Sintetizador de Som</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Transmissão sonora para o celular funcionar como caixa de som sem fio e feedback sonoro dos cliques e teclas.
              </p>
            </div>
          </div>

          {/* Permission 4: Vibração */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Vibrate className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs flex-1">
              <span className="font-bold text-slate-800">Resposta Háptica (Vibração Tátil)</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Feedback tátil ao pressionar botões do mouse e teclado no celular, simulando um periférico físico real.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleRequestAllPermissions}
            disabled={requesting}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{requesting ? 'Solicitando Permissões...' : 'Permitir e Ativar Recursos Agora'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSkipOrBasic}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Continuar com Permissões Básicas (Touchpad e Teclado Wi-Fi)
          </button>
        </div>
      </div>
    </div>
  );
};
