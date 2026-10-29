import React from 'react';
import { 
  Wifi, 
  Smartphone, 
  Laptop, 
  Activity, 
  Download, 
  LogOut, 
  User as UserIcon,
  RefreshCw,
  Cable,
  Zap,
  Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConnectionProtocol, DeviceRole, LatencyStats } from '../types/sync';
import { Logo } from './Logo';

interface NavbarProps {
  role: DeviceRole | null;
  onResetRole: () => void;
  status: 'idle' | 'waiting' | 'connected' | 'disconnected';
  protocol: ConnectionProtocol;
  latencyStats: LatencyStats | null;
  onOpenInstallModal: () => void;
  onOpenAuth: () => void;
  sessionId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  onResetRole,
  status,
  protocol,
  latencyStats,
  onOpenInstallModal,
  onOpenAuth,
  sessionId,
}) => {
  const { user, isGuest, guestName, logout } = useAuth();

  const getLagBadge = () => {
    if (status === 'connected') {
      if (protocol === 'usb_cable') {
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Cable className="w-3.5 h-3.5 text-cyan-600" />
            <span className="font-mono font-bold">Ping: &lt;1ms</span>
            <span className="text-slate-300">•</span>
            <span className="text-cyan-800 font-bold">Lag Zero (USB)</span>
          </div>
        );
      }

      const rtt = latencyStats?.rtt ?? 12;
      let lagText = 'Ultrabaixo';
      let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      if (rtt <= 25) {
        lagText = 'Lag Ultrabaixo';
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (rtt <= 70) {
        lagText = 'Lag Baixo';
        badgeStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      } else if (rtt <= 130) {
        lagText = 'Lag Moderado';
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      } else {
        lagText = 'Lag Alto';
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      }

      return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold">Ping: {rtt}ms</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold">{lagText}</span>
        </div>
      );
    }

    if (status === 'waiting') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Aguardando Conexão...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <Gauge className="w-3.5 h-3.5 text-cyan-600" />
        <span className="font-mono">Ping: 0ms</span>
        <span className="text-slate-300">•</span>
        <span>Pronto</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onResetRole}
            className="flex items-center text-left group focus:outline-none"
            title="Voltar ao início"
          >
            <Logo size="sm" animated={true} showText={true} />
          </button>
        </div>

        {/* Center: Live Ping & Lag + Device Role */}
        <div className="flex items-center gap-2">
          {getLagBadge()}
          {role && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {role === 'host' ? <Laptop className="w-3.5 h-3.5 text-cyan-600" /> : <Smartphone className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{role === 'host' ? 'Modo Receptor' : 'Modo Acessório'}</span>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button (Replaces old '?' guide button) */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 shadow-xs transition-all hover:scale-102"
            title="Instalar aplicativo PWA"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Instalar App</span>
            <span className="sm:hidden">App</span>
          </button>

          {/* Reset / Change Role */}
          {role && (
            <button
              onClick={onResetRole}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Trocar de modo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* User profile / Auth button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Usuário'} 
                  className="w-7 h-7 rounded-full border border-cyan-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-200">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs">
                <p className="font-semibold text-slate-800 truncate max-w-[110px]">{user.displayName || user.email}</p>
                <p className="text-[10px] text-cyan-600">Google / Firebase</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-[90px]">{guestName}</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors hidden sm:block"
              >
                Fazer Login
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-95 text-white shadow-sm transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
