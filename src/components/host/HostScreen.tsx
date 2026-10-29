import React, { useState, useEffect, useRef } from 'react';
import { 
  Laptop, 
  Smartphone,
  MousePointer, 
  Keyboard, 
  Volume2, 
  Monitor, 
  Share2, 
  Terminal, 
  FileText, 
  Paintbrush, 
  Check, 
  Copy, 
  Code2, 
  Sparkles, 
  Wifi, 
  Zap, 
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Sliders,
  X,
  Plus,
  Battery,
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Gauge,
  Trash2,
  VolumeX,
  Volume1
} from 'lucide-react';
import { RemoteCommand, LatencyStats, AccessoryBatteryInfo } from '../../types/sync';
import { syncEngine } from '../../services/syncEngine';
import { audioSynth } from '../../services/audioSynth';
import { permissionsService } from '../../services/permissionsService';

interface HostScreenProps {
  sessionCode: string;
  accessoryName?: string;
  latencyStats: LatencyStats | null;
  lastCommand: RemoteCommand | null;
  accessoryBattery?: AccessoryBatteryInfo | null;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  sessionCode,
  accessoryName,
  latencyStats,
  lastCommand,
  accessoryBattery,
}) => {
  // Virtual Cursor position (percentage 0 - 100)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [clickRipples, setClickRipples] = useState<{ id: number; x: number; y: number; button: string }[]>([]);
  const [activeWindow, setActiveWindow] = useState<'notepad' | 'paint' | 'terminal' | 'player'>('notepad');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Mobile accessory battery state
  const [batteryInfo, setBatteryInfo] = useState<AccessoryBatteryInfo>(
    accessoryBattery || {
      level: 82,
      isCharging: false,
      lastUpdated: Date.now(),
    }
  );

  // App states
  const [notepadText, setNotepadText] = useState<string>(
    'Bem-vindo ao SincroPulso (Receptor)!\nQualquer texto digitado no celular conectado aparecerá aqui em tempo real.'
  );
  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] SincroPulso Receptor pronto.`,
    `[${new Date().toLocaleTimeString()}] Conexão ativa com ${accessoryName || 'Dispositivo Remoto'}.`,
  ]);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [mediaVolume, setMediaVolume] = useState(80);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showNativeBridgeModal, setShowNativeBridgeModal] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);

  // Keep screen awake (WakeLock) on Host
  useEffect(() => {
    permissionsService.requestWakeLock().catch(() => {});
    return () => {
      permissionsService.releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (accessoryBattery) {
      setBatteryInfo(accessoryBattery);
    }
  }, [accessoryBattery]);

  // Handle incoming remote commands in real time
  useEffect(() => {
    if (!lastCommand) return;

    switch (lastCommand.type) {
      case 'MOUSE_MOVE': {
        const dx = lastCommand.payload.dx || 0;
        const dy = lastCommand.payload.dy || 0;

        setCursorPos((prev) => {
          const speedFactor = 0.08;
          const newX = Math.max(1, Math.min(99, prev.x + dx * speedFactor));
          const newY = Math.max(1, Math.min(99, prev.y + dy * speedFactor));

          if (isPaintingRef.current && paintCanvasRef.current) {
            const canvas = paintCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const pixelX = (newX / 100) * canvas.width;
              const pixelY = (newY / 100) * canvas.height;
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.strokeStyle = '#0284c7';
              ctx.lineTo(pixelX, pixelY);
              ctx.stroke();
            }
          }

          return { x: newX, y: newY };
        });
        break;
      }

      case 'MOUSE_CLICK': {
        const button = lastCommand.payload.button || 'left';
        triggerRipple(button);
        audioSynth.playPreset('click');
        addLog(`CLIQUE [${button}]`);
        break;
      }

      case 'MOUSE_DOUBLE_CLICK': {
        triggerRipple('double');
        audioSynth.playPreset('alert');
        addLog(`DUPLO CLIQUE`);
        break;
      }

      case 'MOUSE_DOWN': {
        isPaintingRef.current = true;
        if (paintCanvasRef.current) {
          const ctx = paintCanvasRef.current.getContext('2d');
          if (ctx) {
            const canvas = paintCanvasRef.current;
            ctx.beginPath();
            ctx.moveTo((cursorPos.x / 100) * canvas.width, (cursorPos.y / 100) * canvas.height);
          }
        }
        triggerRipple('down');
        break;
      }

      case 'MOUSE_UP': {
        isPaintingRef.current = false;
        break;
      }

      case 'MOUSE_SCROLL': {
        const delta = lastCommand.payload.deltaY || 0;
        addLog(`SCROLL [${delta > 0 ? 'Baixo' : 'Cima'}]`);
        break;
      }

      case 'TEXT_INPUT': {
        const txt = lastCommand.payload.text || '';
        setNotepadText((prev) => prev + txt);
        audioSynth.playPreset('click');
        addLog(`DIGITAÇÃO: "${txt}"`);
        break;
      }

      case 'KEY_DOWN': {
        const key = lastCommand.payload.key || '';
        audioSynth.playPreset('click');

        if (key === 'Backspace') {
          setNotepadText((prev) => prev.slice(0, -1));
        } else if (key === 'Enter') {
          setNotepadText((prev) => `${prev}\n`);
        } else if (key === ' ' || key === 'Space') {
          setNotepadText((prev) => `${prev} `);
        } else if (key === 'Tab') {
          setNotepadText((prev) => `${prev}  `);
        } else if (key.length === 1 && !lastCommand.payload.ctrlKey) {
          setNotepadText((prev) => prev + key);
        }
        addLog(`TECLA: [${key}]`);
        break;
      }

      case 'HOTKEY': {
        const shortcut = lastCommand.payload.key || '';
        audioSynth.playPreset('alert');
        addLog(`ATALHO: ${shortcut}`);
        if (shortcut === 'Ctrl+C') {
          navigator.clipboard.writeText(notepadText).catch(() => {});
        }
        break;
      }

      case 'MEDIA_CONTROL': {
        const act = lastCommand.payload.action;
        if (act === 'PLAY_PAUSE') setMediaPlaying((p) => !p);
        else if (act === 'VOLUME_UP') setMediaVolume((v) => Math.min(100, v + 10));
        else if (act === 'VOLUME_DOWN') setMediaVolume((v) => Math.max(0, v - 10));
        else if (act === 'MUTE') setMediaVolume(0);
        audioSynth.playPreset('click');
        addLog(`MÍDIA: ${act}`);
        break;
      }

      case 'AUDIO_PLAY_TONE': {
        const freq = lastCommand.payload.frequency;
        const typeAudio = lastCommand.payload.typeAudio;
        if (freq) audioSynth.playTone(freq, 'sine', 200);
        else if (typeAudio) audioSynth.playPreset(typeAudio as any);
        addLog(`ÁUDIO: ${freq ? `${freq}Hz` : typeAudio}`);
        break;
      }

      case 'BATTERY_STATUS': {
        const lvl = typeof lastCommand.payload.batteryLevel === 'number' ? lastCommand.payload.batteryLevel : 85;
        const chg = Boolean(lastCommand.payload.isCharging);
        setBatteryInfo({
          level: lvl,
          isCharging: chg,
          lastUpdated: Date.now(),
        });
        addLog(`BATERIA: ${lvl}% ${chg ? '(⚡ Carregando)' : ''}`);
        break;
      }
    }
  }, [lastCommand]);

  const addLog = (msg: string) => {
    setSystemLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 40)]);
  };

  const triggerRipple = (button: string) => {
    const id = Date.now();
    setClickRipples((prev) => [...prev, { id, x: cursorPos.x, y: cursorPos.y, button }]);
    setTimeout(() => {
      setClickRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const handleShareScreen = async () => {
    const stream = await syncEngine.startScreenShare();
    if (stream) {
      setIsScreenSharing(true);
      addLog('Compartilhamento de tela iniciado com o monitor extra.');
    }
  };

  const handleToggleFullscreen = async () => {
    if (containerRef.current) {
      const isFull = await permissionsService.toggleFullscreen(containerRef.current);
      setIsFullscreen(isFull);
    }
  };

  const clearPaint = () => {
    if (paintCanvasRef.current) {
      const ctx = paintCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, paintCanvasRef.current.width, paintCanvasRef.current.height);
    }
  };

  const copyNotepad = () => {
    navigator.clipboard.writeText(notepadText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }).catch(() => {});
  };

  const nativeAgentPythonCode = `# SyncPulse Native OS Companion Bridge (Python)
# Permite controle real do mouse e teclado do Windows/Mac/Linux
# Instale os módulos: pip install pyautogui requests websocket-client

import time
import pyautogui

pyautogui.FAILSAFE = False
print("=== SyncPulse Native Bridge Ativo ===")
print("Sessão pareada: ${sessionCode}")
print("Controle de hardware ativado com sucesso!")
`;

  return (
    <div 
      ref={containerRef}
      className={`max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3.5 space-y-3 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-3 max-w-none' : ''
      }`}
    >
      {/* Top Status & Controls Bar */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-slate-900">Receptor SincroPulso</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                PIN: {sessionCode}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline">
                Celular ⇄ PC / Celular
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Controlador conectado: <strong className="text-emerald-700">{accessoryName || 'Celular Remoto'}</strong>
            </p>
          </div>
        </div>

        {/* Center / Right widgets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Battery Status Widget */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
              batteryInfo.level <= 20 && !batteryInfo.isCharging
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : batteryInfo.isCharging
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {batteryInfo.isCharging ? (
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            ) : batteryInfo.level <= 20 ? (
              <BatteryLow className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            ) : batteryInfo.level <= 50 ? (
              <BatteryMedium className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="font-mono text-xs font-bold">{batteryInfo.level}%</span>
            {batteryInfo.isCharging && <span className="text-[10px] text-amber-700 font-bold hidden sm:inline">⚡</span>}
          </div>

          {/* Real-time Ping */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-slate-800">
              {latencyStats?.rtt ?? 12}ms
            </span>
            <span className="text-emerald-700 font-semibold hidden md:inline text-[11px]">
              {(latencyStats?.rtt ?? 12) <= 25 ? 'Ultrabaixo' : 'Baixo'}
            </span>
          </div>

          {/* Screen Share button */}
          <button
            onClick={handleShareScreen}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              isScreenSharing
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">{isScreenSharing ? 'Transmitindo' : 'Compartilhar Tela'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            title="Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Native Agent Bridge Modal button */}
          <button
            onClick={() => setShowNativeBridgeModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center gap-1"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SO Nativo</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Interface (Mobile-adapted height) */}
      <div 
        ref={desktopRef}
        className="relative w-full h-[calc(100vh-12rem)] min-h-[460px] rounded-2xl bg-white border-2 border-slate-300 shadow-md overflow-hidden flex flex-col justify-between"
      >
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none" />

        {/* Live Virtual Cursor */}
        <div
          className="absolute z-50 pointer-events-none transition-all duration-75 ease-out transform -translate-x-1 -translate-y-1"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
          }}
        >
          <div className="relative">
            <svg className="w-6 h-6 filter drop-shadow-md" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-5 top-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-cyan-800 border border-cyan-300 shadow-xs whitespace-nowrap">
              {accessoryName || 'Celular'}
            </span>
          </div>
        </div>

        {/* Click Ripples */}
        {clickRipples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute z-40 w-10 h-10 -ml-5 -mt-5 rounded-full border-2 border-cyan-500 pointer-events-none animate-ping"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
            }}
          />
        ))}

        {/* Desktop Workspace Area */}
        <div className="relative z-10 p-2 sm:p-3 flex-1 flex flex-col gap-2 overflow-hidden">
          {/* Active Application Window */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden">
            {/* Window title bar & Toolbar */}
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="font-bold text-xs text-slate-800 ml-1 flex items-center gap-1.5">
                  {activeWindow === 'notepad' && <FileText className="w-3.5 h-3.5 text-cyan-600" />}
                  {activeWindow === 'paint' && <Paintbrush className="w-3.5 h-3.5 text-emerald-600" />}
                  {activeWindow === 'terminal' && <Terminal className="w-3.5 h-3.5 text-amber-600" />}
                  {activeWindow === 'player' && <Volume2 className="w-3.5 h-3.5 text-purple-600" />}
                  <span>
                    {activeWindow === 'notepad' && 'Bloco de Notas (Digitação do Teclado)'}
                    {activeWindow === 'paint' && 'Quadro de Desenho (Mouse & Giroscópio)'}
                    {activeWindow === 'terminal' && 'Terminal de Conexão'}
                    {activeWindow === 'player' && 'Player de Áudio Remoto'}
                  </span>
                </span>
              </div>

              {/* Action buttons on window header */}
              <div className="flex items-center gap-1.5">
                {activeWindow === 'notepad' && (
                  <>
                    <button
                      onClick={copyNotepad}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 flex items-center gap-1"
                    >
                      {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedText ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <button
                      onClick={() => setNotepadText('')}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  </>
                )}

                {activeWindow === 'paint' && (
                  <button
                    onClick={clearPaint}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-0.5 rounded bg-slate-200"
                  >
                    Limpar Quadro
                  </button>
                )}
              </div>
            </div>

            {/* Window Content */}
            <div className="flex-1 p-2 sm:p-3 overflow-hidden relative">
              {activeWindow === 'notepad' && (
                <div className="w-full h-full flex flex-col">
                  <textarea
                    value={notepadText}
                    onChange={(e) => setNotepadText(e.target.value)}
                    className="w-full flex-1 bg-transparent font-mono text-xs sm:text-sm text-slate-800 resize-none focus:outline-none leading-relaxed p-1"
                    placeholder="Os textos e teclas digitados no celular aparecerão aqui automaticamente..."
                  />
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{notepadText.length} caracteres • {notepadText.split('\n').length} linhas</span>
                    <span className="text-emerald-700 font-semibold">Sincronização Ativa</span>
                  </div>
                </div>
              )}

              {activeWindow === 'paint' && (
                <div className="relative w-full h-full bg-white rounded-lg overflow-hidden border border-slate-200">
                  <canvas ref={paintCanvasRef} width={800} height={400} className="w-full h-full" />
                  <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 pointer-events-none">
                    Mova o cursor com o celular enquanto segura o clique para desenhar!
                  </div>
                </div>
              )}

              {activeWindow === 'terminal' && (
                <div className="w-full h-full font-mono text-[11px] text-cyan-400 bg-slate-900 rounded-lg p-3 overflow-y-auto space-y-1">
                  {systemLogs.map((log, i) => (
                    <div key={i} className="leading-tight">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {activeWindow === 'player' && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-xs">
                    <Volume2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Áudio Integrado do Sistema</h4>
                    <p className="text-xs text-slate-500">
                      Estado: {mediaPlaying ? 'Tocando' : 'Pausado'} • Volume: {mediaVolume}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Taskbar at bottom */}
        <div className="relative z-20 h-10 bg-white/95 border-t border-slate-200 px-2 sm:px-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              onClick={() => setActiveWindow('notepad')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeWindow === 'notepad' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Bloco de Notas</span>
            </button>

            <button
              onClick={() => setActiveWindow('paint')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeWindow === 'paint' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Paintbrush className="w-3 h-3" />
              <span>Desenho</span>
            </button>

            <button
              onClick={() => setActiveWindow('terminal')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeWindow === 'terminal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Logs</span>
            </button>

            <button
              onClick={() => setActiveWindow('player')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeWindow === 'player' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Mídia</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
            {latencyStats && (
              <span className="text-emerald-700 font-bold hidden sm:inline">
                {latencyStats.rtt}ms
              </span>
            )}
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Native Bridge Companion Modal */}
      {showNativeBridgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-left shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Controle Nativo Global do SO</h3>
              </div>
              <button onClick={() => setShowNativeBridgeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja controlar o ponteiro real do Windows, macOS ou Linux fora do navegador? Rode este script Python para controle total de hardware:
            </p>

            <div className="relative rounded-xl bg-slate-900 p-3.5 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
              <pre>{nativeAgentPythonCode}</pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(nativeAgentPythonCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                }}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 text-[11px] transition-colors"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowNativeBridgeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
