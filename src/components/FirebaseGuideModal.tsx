import React from 'react';
import { X, ExternalLink, CheckCircle2, Shield, Key, Globe, Zap, Server } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const projectId = (firebaseConfig as any)?.projectId || 'gen-lang-client-0961211045';
  const consoleAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Guia de Configuração do Firebase</h2>
              <p className="text-xs text-slate-500">O que você precisa saber e como ativar os provedores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Status badge */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 text-xs sm:text-sm">Firebase e Firestore já provisionados!</h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                O banco de dados Firestore, as regras de segurança e o relé em tempo real já foram integrados no projeto <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-mono text-[11px]">{projectId}</code>.
              </p>
            </div>
          </div>

          {/* Steps required by user */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Passo a Passo: Provedores de Acesso
            </h3>

            {/* Step 1: Google Login */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 font-mono text-xs flex items-center justify-center font-bold">1</span>
                  Login com Google
                </span>
                <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">Pronto</span>
              </div>
              <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                O OAuth do Google já foi associado ao app. Ao clicar no botão <strong>Continuar com o Google</strong>, o popup de login abrirá automaticamente.
              </p>
            </div>

            {/* Step 2: Email & Password */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-mono text-xs flex items-center justify-center font-bold">2</span>
                  Login com E-mail e Senha (Opcional)
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Ativar no Console</span>
              </div>
              <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                Para que usuários novos possam se cadastrar com e-mail/senha:
                <br />
                1. Abra o <a href={consoleAuthUrl} target="_blank" rel="noreferrer" className="text-cyan-700 underline font-medium inline-flex items-center gap-1">Console do Firebase <ExternalLink className="w-3 h-3" /></a>
                <br />
                2. Vá em <strong>Authentication &gt; Sign-in method</strong>.
                <br />
                3. Clique em <strong>Email/Password</strong> e marque <strong>Habilitar (Enable)</strong>.
              </p>
            </div>

            {/* Step 3: WebRTC, LAN e Cabo USB */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-2 text-xs sm:text-sm">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Conexão Sem Fio e Cabo USB (Chrome)
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">100% Funcional</span>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                Você pode parear via Wi-Fi pelo QR Code ou PIN de 6 dígitos, ou usar conexão cabeada (WebUSB / Ancoragem USB) com latência física inferior a 1ms!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          <a
            href={consoleAuthUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs"
          >
            <Server className="w-3.5 h-3.5 text-cyan-600" />
            <span>Console do Firebase</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
