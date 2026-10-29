import React from 'react';
import { 
  Laptop, 
  Smartphone, 
  MousePointer, 
  Keyboard, 
  Volume2, 
  Monitor, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  QrCode,
  Download,
  Sparkles,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { DeviceRole } from '../types/sync';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface RoleSelectorProps {
  onSelectRole: (role: DeviceRole) => void;
  onOpenInstallModal: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  onSelectRole, 
  onOpenInstallModal 
}) => {
  const { canPrompt, triggerInstallPrompt, isInstalled } = usePWAInstall();

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canPrompt) {
      const outcome = await triggerInstallPrompt();
      if (outcome !== 'accepted') {
        onOpenInstallModal();
      }
    } else {
      onOpenInstallModal();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-2.5 sm:py-4 h-[calc(100vh-4.5rem)] flex flex-col justify-between gap-2.5 select-none overflow-hidden">
      {/* Compact Header */}
      <div className="text-center space-y-1 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
          <span>Sincronização em Tempo Real • Wi-Fi, LAN e Cabo USB</span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-emerald-700 font-bold hidden sm:inline">Lag Ultrabaixo</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          SincroPulso: <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-indigo-600">Controle Universal</span>
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl mx-auto line-clamp-1 sm:line-clamp-2">
          Transforme seu celular em <strong>Mouse (Giroscópio ou Touchpad)</strong>, <strong>Teclado</strong>, <strong>Caixa de Som</strong> ou <strong>Monitor Extra</strong> para seu PC.
        </p>
      </div>

      {/* The 2 Main Role Cards - Both clearly visible without scrolling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 flex-1 items-stretch min-h-0">
        {/* Option 1: Conectar com um dispositivo (Host / Receptor) */}
        <div 
          onClick={() => onSelectRole('host')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-cyan-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden text-left"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                Opção 1 • PC / Receptor
              </span>
            </div>

            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                Conectar com um dispositivo
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Este computador receberá comandos e exibirá o código PIN / QR Code para ser controlado à distância.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <QrCode className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">Gera QR Code e PIN</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <MousePointer className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">Cursor Interativo</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <Keyboard className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">Bloco de Notas & Paint</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span className="truncate">Permissões Seguras</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-2">
            <span className="text-[11px] font-medium text-slate-500">Usar nesta tela</span>
            <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 group-hover:bg-cyan-700 text-white shadow-xs flex items-center gap-1.5 transition-colors">
              <span>Iniciar Receptor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Option 2: Ser o acessório (Controlador / Celular) */}
        <div 
          onClick={() => onSelectRole('accessory')}
          className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden text-left"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Opção 2 • Celular / Acessório
              </span>
            </div>

            <div className="space-y-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Ser o acessório
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transforme este aparelho no periférico (Mouse Touchpad ou Giroscópio 3D, Teclado, Caixa de Som ou Monitor).
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <MousePointer className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Giroscópio & Touchpad</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <Keyboard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Teclado com Atalhos</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Caixa de Som & Mic</span>
              </div>
              <div className="p-1.5 sm:p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                <Monitor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Monitor Extra 60 FPS</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-2">
            <span className="text-[11px] font-medium text-slate-500">Usar como controle</span>
            <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 group-hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors">
              <span>Escolher Acessório</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* PWA Download Banner (Replaces old footer below "ser o acessório") */}
      <div className="shrink-0 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-cyan-50 via-white to-indigo-50 border border-cyan-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-600/20">
            <Download className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                Baixe este aplicativo no seu celular ou computador!
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hidden md:inline">
                PWA Nativo
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Instale em 1 clique para usar em <strong>tela cheia sem barras de navegador</strong>, com giroscópio e haptics em máxima velocidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalled ? 'Abrir Guia de Instalação' : 'Instalar Aplicativo Agora'}</span>
          </button>

          <button
            onClick={onOpenInstallModal}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
            title="Ver tutorial para iOS, Android e PC"
          >
            Tutorial OS
          </button>
        </div>
      </div>
    </div>
  );
};
