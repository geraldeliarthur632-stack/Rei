import React from 'react';
import { 
  ShieldAlert, 
  Check, 
  X, 
  Compass, 
  Camera, 
  Mic, 
  MousePointer, 
  Monitor, 
  HelpCircle,
  Smartphone
} from 'lucide-react';

interface SensorPermissionPromptProps {
  isOpen: boolean;
  onGrantSensors: () => void;
  onUseTouchpadFallback: () => void;
}

export const SensorPermissionPrompt: React.FC<SensorPermissionPromptProps> = ({
  isOpen,
  onGrantSensors,
  onUseTouchpadFallback,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Permissão para Sensores de Movimento</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Deseja usar o <strong>giroscópio do celular</strong> como Air Mouse (apontando o celular no ar para mover o cursor no computador)?
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-700 font-semibold">
            <MousePointer className="w-3.5 h-3.5" />
            <span>Alternativa Automática Disponível</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Se você não conceder permissão de movimento, o app ativará o modo <strong>Touchpad</strong>, permitindo mover o cursor deslizando o dedo sobre a tela!
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={onGrantSensors}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Permitir Sensores (Air Mouse 3D)</span>
          </button>

          <button
            onClick={onUseTouchpadFallback}
            className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            Usar Touchpad com o Dedo na Tela (Sem Sensores)
          </button>
        </div>
      </div>
    </div>
  );
};

interface HostControlAuthorizationModalProps {
  isOpen: boolean;
  accessoryName: string;
  accessoryType?: string;
  onAuthorize: () => void;
  onDeny: () => void;
}

export const HostControlAuthorizationModal: React.FC<HostControlAuthorizationModalProps> = ({
  isOpen,
  accessoryName,
  accessoryType,
  onAuthorize,
  onDeny,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7 text-cyan-600" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            Solicitação de Controle Remoto
          </span>
          <h3 className="text-xl font-bold text-slate-900">Autorizar Controle Total?</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            O dispositivo <strong className="text-cyan-700">{accessoryName || 'Dispositivo Remoto'}</strong> conectou e solicita permissão para controlar o <strong>mouse, teclado, tela e áudio</strong> deste sistema.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-600">
          <p className="font-semibold text-slate-800 text-xs">Permissões concedidas:</p>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Mover Cursor & Cliques</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Digitação & Atalhos</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Transmitir Áudio / Som</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Espelhar Tela / Monitor</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={onDeny}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Recusar</span>
          </button>

          <button
            onClick={onAuthorize}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Autorizar Controle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
