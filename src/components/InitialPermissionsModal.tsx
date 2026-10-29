import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Compass, 
  Camera, 
  Volume2, 
  Vibrate, 
  Check, 
  ArrowRight,
  Sparkles,
  X,
  Smartphone,
  Eye,
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { permissionsService } from '../services/permissionsService';

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
  const [grantedSummary, setGrantedSummary] = useState<{
    motion: boolean;
    camera: boolean;
    microphone: boolean;
    wakeLock: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleRequestAllPermissions = async () => {
    setRequesting(true);

    try {
      const results = await permissionsService.requestAllPermissions();
      setGrantedSummary(results);
    } catch (e) {
      console.warn('Error requesting permissions:', e);
    }

    setRequesting(false);
    onPermissionsGranted?.();
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleSkipOrBasic = () => {
    localStorage.setItem('sincropulso_permissions_reviewed', 'true');
    permissionsService.unlockWebAudio();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-6 text-left space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Permissões do Dispositivo
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Celular ⇄ PC / Celular
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ative os recursos de hardware para controle total em tempo real com baixa latência
              </p>
            </div>
          </div>
          <button
            onClick={handleSkipOrBasic}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permissions Grid */}
        <div className="space-y-2 text-xs">
          {/* Permission 1: Sensores de Movimento / Giroscópio */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5">
              <Compass className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Giroscópio &amp; Movimento 3D</span>
                {grantedSummary?.motion && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Concedido
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Mova o celular pelo ar para guiar o cursor no computador ou em outro celular (ou use o Touchpad deslizando o dedo).
              </p>
            </div>
          </div>

          {/* Permission 2: Microfone e Transmissão de Voz */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Microfone &amp; Áudio Sem Fio</span>
                {grantedSummary?.microphone && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Concedido
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Transforma o aparelho em caixa de som remota e permite falar pelo microfone do celular para sair no PC/outro celular.
              </p>
            </div>
          </div>

          {/* Permission 3: Câmera para Scanner QR Code */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Camera className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Câmera (Leitor de QR Code)</span>
                {grantedSummary?.camera && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Concedido
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Escaneia o QR Code do computador ou de outro celular para sincronizar instantaneamente sem digitar o PIN.
              </p>
            </div>
          </div>

          {/* Permission 4: Tela Sempre Ativa (Wake Lock) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Eye className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Tela Sempre Ativa (Wake Lock)</span>
                {grantedSummary?.wakeLock && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Concedido
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Impede que o celular apague a tela ou bloqueie durante o uso como teclado, mouse ou monitor extra.
              </p>
            </div>
          </div>

          {/* Permission 5: Vibração Tátil (Háptica) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Vibrate className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <span className="font-bold text-slate-800">Resposta Háptica (Vibração Tátil)</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Sensação física de clique mecânico em cada tecla do teclado virtual e botões do mouse.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={handleRequestAllPermissions}
            disabled={requesting}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all hover:scale-101"
          >
            <Sparkles className="w-4 h-4" />
            <span>{requesting ? 'Solicitando Permissões ao Sistema...' : 'Conceder Todas as Permissões Agora'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSkipOrBasic}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Continuar com Recursos Básicos (Touchpad e Digitação Padrão)
          </button>
        </div>
      </div>
    </div>
  );
};
