import React, { useState, useEffect, useRef } from 'react';
import { 
  MousePointer, 
  Compass, 
  Sliders, 
  RotateCcw, 
  Move, 
  HandMetal, 
  ShieldCheck, 
  Maximize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { syncEngine } from '../../services/syncEngine';

interface MouseControllerProps {
  onBack?: () => void;
  requestSensorPermission?: () => void;
}

export const MouseController: React.FC<MouseControllerProps> = ({ requestSensorPermission }) => {
  const [mode, setMode] = useState<'touchpad' | 'gyro'>('touchpad');
  const [sensitivity, setSensitivity] = useState<number>(1.6);
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [hasGyroSupport, setHasGyroSupport] = useState<boolean>(true);
  const [dragLocked, setDragLocked] = useState<boolean>(false);
  const [feedbackClick, setFeedbackClick] = useState<string | null>(null);

  // References for touch tracking
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isTouchingRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // References for gyro baseline
  const gyroBaselineRef = useRef<{ beta: number; gamma: number } | null>(null);

  const triggerHaptic = (type: 'light' | 'medium') => {
    if (navigator.vibrate) {
      navigator.vibrate(type === 'light' ? 15 : 35);
    }
  };

  // Gyroscope tracking
  useEffect(() => {
    if (mode !== 'gyro') return;

    let available = false;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      available = true;
      setHasGyroSupport(true);

      if (!gyroActive) return;

      if (!gyroBaselineRef.current) {
        gyroBaselineRef.current = { beta: e.beta, gamma: e.gamma };
        return;
      }

      const rawDx = (e.gamma - gyroBaselineRef.current.gamma);
      const rawDy = (e.beta - gyroBaselineRef.current.beta);

      const deadzone = 0.4;
      const dx = Math.abs(rawDx) > deadzone ? rawDx * sensitivity * 4 : 0;
      const dy = Math.abs(rawDy) > deadzone ? rawDy * sensitivity * 4 : 0;

      if (dx !== 0 || dy !== 0) {
        syncEngine.sendCommand({
          id: `gyro_${Date.now()}`,
          type: 'MOUSE_MOVE',
          timestamp: Date.now(),
          payload: { dx, dy },
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    const timer = setTimeout(() => {
      if (!available) {
        setHasGyroSupport(false);
      }
    }, 1500);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      clearTimeout(timer);
    };
  }, [mode, gyroActive, sensitivity]);

  const calibrateGyro = () => {
    gyroBaselineRef.current = null;
    triggerHaptic('medium');
    setFeedbackClick('Calibrado!');
    setTimeout(() => setFeedbackClick(null), 1000);
  };

  // Touchpad touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const now = Date.now();
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
    isTouchingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!lastTouchRef.current) return;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const deltaY = (touch1.clientY - lastTouchRef.current.y) * 2;
      syncEngine.sendCommand({
        id: `scroll_${Date.now()}`,
        type: 'MOUSE_SCROLL',
        timestamp: Date.now(),
        payload: { deltaY: -deltaY },
      });
      lastTouchRef.current = { x: touch1.clientX, y: touch1.clientY, time: Date.now() };
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = (touch.clientX - lastTouchRef.current.x) * sensitivity;
      const dy = (touch.clientY - lastTouchRef.current.y) * sensitivity;

      syncEngine.sendCommand({
        id: `mv_${Date.now()}`,
        type: 'MOUSE_MOVE',
        timestamp: Date.now(),
        payload: { dx, dy },
      });

      lastTouchRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (touchStartRef.current && lastTouchRef.current) {
      const duration = now - touchStartRef.current.time;
      const dist = Math.hypot(
        lastTouchRef.current.x - touchStartRef.current.x,
        lastTouchRef.current.y - touchStartRef.current.y
      );

      if (duration < 250 && dist < 12) {
        handleMouseClick('left');
      }
    }
    lastTouchRef.current = null;
    touchStartRef.current = null;
    isTouchingRef.current = false;
  };

  const handleMouseClick = (button: 'left' | 'right' | 'middle') => {
    triggerHaptic('light');
    setFeedbackClick(button === 'left' ? 'Clique Esquerdo' : button === 'right' ? 'Clique Direito' : 'Meio');
    setTimeout(() => setFeedbackClick(null), 400);

    syncEngine.sendCommand({
      id: `clk_${Date.now()}`,
      type: 'MOUSE_CLICK',
      timestamp: Date.now(),
      payload: { button },
    });
  };

  const handleDoubleClick = () => {
    triggerHaptic('medium');
    setFeedbackClick('Duplo Clique');
    setTimeout(() => setFeedbackClick(null), 400);

    syncEngine.sendCommand({
      id: `dbl_${Date.now()}`,
      type: 'MOUSE_DOUBLE_CLICK',
      timestamp: Date.now(),
      payload: { button: 'left' },
    });
  };

  const handleScrollStep = (dir: 'up' | 'down') => {
    triggerHaptic('light');
    syncEngine.sendCommand({
      id: `step_${Date.now()}`,
      type: 'MOUSE_SCROLL',
      timestamp: Date.now(),
      payload: { deltaY: dir === 'up' ? -120 : 120 },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-xl mx-auto p-3 sm:p-4 gap-3 select-none">
      {/* Mode Switcher & Sensitivity Bar */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 text-xs shrink-0 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setMode('touchpad')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'touchpad' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Touchpad</span>
          </button>
          <button
            onClick={() => {
              if (requestSensorPermission) requestSensorPermission();
              setMode('gyro');
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
              mode === 'gyro' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Giroscópio (Air)</span>
          </button>
        </div>

        {/* Sensitivity slider */}
        <div className="flex items-center gap-1.5 px-2 text-slate-600">
          <Sliders className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden sm:inline text-[11px] font-medium">Sensibilidade:</span>
          <input
            type="range"
            min="0.6"
            max="3.5"
            step="0.2"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-16 accent-cyan-600 cursor-pointer"
          />
          <span className="font-mono text-[11px] text-cyan-700 font-bold w-6">{sensitivity.toFixed(1)}x</span>
        </div>
      </div>

      {/* Main Touchpad / Gyro Area */}
      {mode === 'touchpad' ? (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative flex-1 rounded-2xl bg-white border-2 border-slate-300 active:border-cyan-500 shadow-sm flex flex-col items-center justify-center p-6 text-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        >
          {/* Visual Trackpad Surface Pattern */}
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Feedback badge */}
          {feedbackClick && (
            <div className="absolute top-4 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs font-bold animate-bounce pointer-events-none shadow-xs">
              {feedbackClick}
            </div>
          )}

          {/* Guide icon and text */}
          <div className="space-y-2 pointer-events-none z-10">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-cyan-600 shadow-xs">
              <Move className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Superfície Touchpad</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Deslize o dedo para mover o cursor do computador
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <span>1 Toque = Clique</span>
              <span>•</span>
              <span>2 Dedos = Scroll</span>
            </div>
          </div>

          {/* Scroll Wheel Strip on the right */}
          <div 
            className="absolute right-2 top-6 bottom-6 w-9 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-between p-1 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleScrollStep('up')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 active:bg-cyan-100"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <span className="text-[9px] font-mono font-bold text-slate-400 rotate-90 uppercase">Scroll</span>
            <button
              onClick={() => handleScrollStep('down')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 active:bg-cyan-100"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* GYROSCOPE AIR MOUSE VIEW */
        <div className="relative flex-1 rounded-2xl bg-white border-2 border-indigo-200 shadow-sm flex flex-col items-center justify-between p-5 text-center overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs">
            <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${
              gyroActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {gyroActive ? 'Sensores Ativos' : 'Sensores Pausados'}
            </span>
            <button
              onClick={calibrateGyro}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600" />
              <span>Calibrar Ponto Zero</span>
            </button>
          </div>

          <div className="space-y-3 my-auto">
            <button
              onClick={() => {
                setGyroActive(!gyroActive);
                triggerHaptic('medium');
              }}
              className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-1.5 mx-auto transition-all shadow-md ${
                gyroActive 
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 ring-8 ring-emerald-100 scale-105'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-cyan-500'
              }`}
            >
              <Compass className={`w-9 h-9 ${gyroActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <span className="font-bold text-[11px] uppercase tracking-wider">
                {gyroActive ? 'Pausar Mira' : 'Ativar Mira 3D'}
              </span>
            </button>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {gyroActive 
                ? 'Mova o celular pelo ar para guiar a seta do mouse na tela do PC!' 
                : 'Toque no círculo acima para iniciar o rastreamento giroscópico.'}
            </p>
          </div>

          {!hasGyroSupport && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left w-full">
              <p className="font-semibold">Sensores não detectados neste aparelho.</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Alterne para a aba <strong>Touchpad</strong> acima para mover o cursor com o dedo!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mouse Buttons Bar */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <button
          onClick={() => handleMouseClick('left')}
          className="col-span-2 py-3 px-3 rounded-xl bg-white hover:bg-slate-50 active:bg-cyan-50 border-2 border-slate-200 active:border-cyan-500 text-slate-900 font-bold text-xs shadow-xs flex flex-col items-center justify-center gap-0.5 transition-all"
        >
          <span className="text-[10px] text-cyan-700 uppercase tracking-wider font-extrabold">Botão Esquerdo</span>
          <span className="text-slate-800 font-semibold text-xs">Clique Principal</span>
        </button>

        <button
          onClick={() => handleMouseClick('right')}
          className="py-3 px-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 active:border-slate-400 text-slate-800 font-bold text-xs shadow-xs flex flex-col items-center justify-center gap-0.5 transition-all"
        >
          <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">Direito</span>
          <span className="text-slate-800 text-xs">Menu</span>
        </button>

        <button
          onClick={handleDoubleClick}
          className="py-3 px-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 active:border-slate-400 text-slate-800 font-bold text-xs shadow-xs flex flex-col items-center justify-center gap-0.5 transition-all"
        >
          <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">2x Clique</span>
          <span className="text-slate-800 text-xs">Abrir</span>
        </button>
      </div>
    </div>
  );
};
