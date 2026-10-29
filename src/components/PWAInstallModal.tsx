import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Laptop, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { OperatingSystem } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedOs: OperatingSystem;
  canPrompt: boolean;
  onTriggerPrompt: () => Promise<void>;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  detectedOs,
  canPrompt,
  onTriggerPrompt,
  isInstalled,
}) => {
  const [activeTab, setActiveTab] = useState<OperatingSystem>(detectedOs);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Instalar o SincroPulso
              </h3>
              <p className="text-xs text-slate-500">
                Experiência de app nativo sem barras de navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt button if available */}
        {canPrompt && !isInstalled && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-50 to-indigo-50 border border-cyan-200 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                Instalação em 1 Clique Disponível
              </span>
              <p className="text-[11px] text-slate-600">
                Seu navegador suporta instalação direta instantânea.
              </p>
            </div>
            <button
              onClick={onTriggerPrompt}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm flex items-center gap-1.5 shrink-0 transition-all hover:scale-102"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar Agora</span>
            </button>
          </div>
        )}

        {isInstalled && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>O aplicativo já está instalado no seu dispositivo! Você pode acessá-lo na sua tela inicial ou lista de apps.</span>
          </div>
        )}

        {/* OS Tabs */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center justify-between">
            <span>Tutorial de Instalação por Sistema:</span>
            {activeTab === detectedOs && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                Seu Sistema Detectado
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('android')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'android'
                  ? 'bg-white text-cyan-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Android</span>
            </button>

            <button
              onClick={() => setActiveTab('ios')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'ios'
                  ? 'bg-white text-cyan-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-800" />
              <span>iOS (iPhone)</span>
            </button>

            <button
              onClick={() => setActiveTab('pc')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pc'
                  ? 'bg-white text-cyan-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              <span>PC / Mac</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5 text-xs text-slate-700">
          {activeTab === 'android' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                Como instalar no Android (Google Chrome):
              </h4>
              <ol className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>No Chrome, toque no botão de menu de <strong>três pontinhos (⋮)</strong> no canto superior direito da tela.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>Confirme em <strong>"Instalar"</strong>. O ícone do SincroPulso aparecerá na sua gaveta de aplicativos com resposta em tela cheia e sensores acelerômetro ativos!</span>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-slate-800" />
                Como instalar no iPhone / iPad (Safari):
              </h4>
              <ol className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>No navegador <strong>Safari</strong>, toque no botão <strong>Compartilhar</strong> (quadrado com seta apontando para cima na barra inferior).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (ícone de +).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto! O app rodará sem bordas e com sensibilidade tátil nativa.</span>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-indigo-600" />
                Como instalar no Computador (Windows / macOS / Linux):
              </h4>
              <ol className="space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>No Chrome ou Microsoft Edge, localize o ícone de <strong>instalação de aplicativo</strong> (computador com uma seta para baixo) na barra de endereços URL à direita.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>Ou clique no menu de três pontinhos (⋮) &gt; <strong>"Salvar e compartilhar"</strong> &gt; <strong>"Instalar SincroPulso"</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-[11px] shrink-0">3</span>
                  <span>O SincroPulso se tornará uma janela de aplicativo dedicada sem distrações e com atalhos de teclado do host!</span>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits bar */}
        <div className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-around gap-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-1 font-medium text-slate-800">
            <Zap className="w-3.5 h-3.5 text-cyan-600" />
            Zero latência de navegador
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-medium text-slate-800">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            Tela cheia sem barras
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-medium text-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            100% Grátis & Seguro
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
