import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  animated = true,
  className = '',
}) => {
  // Dimensions for icon
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-sm', badge: 'text-[9px] px-1 py-0.2' },
    sm: { icon: 'w-8 h-8', text: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
    md: { icon: 'w-10 h-10', text: 'text-lg', badge: 'text-[10px] px-1.5 py-0.5' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', badge: 'text-xs px-2 py-0.5' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', badge: 'text-xs px-2.5 py-1' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* High-Tech Futuristic Sync Logo Glyph */}
      <div
        className={`relative ${currentSize.icon} shrink-0 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-md shadow-cyan-600/25 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105`}
      >
        {/* Animated background pulse beam */}
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-white/30 to-indigo-400/20 animate-pulse pointer-events-none" />
        )}

        {/* Inner SVG Logo */}
        <svg
          className="w-full h-full p-1.5 text-white filter drop-shadow-sm"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle orbital circuit line */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Device 1 Node (Host / Screen) */}
          <rect
            x="14"
            y="35"
            width="22"
            height="30"
            rx="5"
            stroke="#ffffff"
            strokeWidth="4"
            fill="rgba(255,255,255,0.15)"
          />
          <line x1="21" y1="58" x2="29" y2="58" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

          {/* Device 2 Node (Mobile / Accessory) */}
          <rect
            x="64"
            y="32"
            width="22"
            height="36"
            rx="5"
            stroke="#ffffff"
            strokeWidth="4"
            fill="rgba(255,255,255,0.15)"
          />
          <circle cx="75" cy="62" r="2.5" fill="#38bdf8" />

          {/* Dynamic Sync Pulse Wave connecting both */}
          <path
            d="M36 50 L42 50 L46 36 L54 64 L58 43 L62 50 L64 50"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Energetic Core */}
          <circle cx="50" cy="50" r="4.5" fill="#ffffff" />
          <circle cx="50" cy="50" r="9" stroke="#38bdf8" strokeWidth="2" opacity="0.6" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 ${currentSize.text}`}>
              Sincro<span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600">Pulso</span>
            </span>
            <span className={`font-bold uppercase tracking-wider rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 ${currentSize.badge}`}>
              Sync
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-tight">
            Controle Universal Celular & PC
          </p>
        </div>
      )}
    </div>
  );
};
