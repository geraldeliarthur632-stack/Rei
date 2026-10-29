import React, { useState } from 'react';
import { 
  Keyboard, 
  Send, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  CornerDownLeft,
  Delete,
  Copy,
  Clipboard,
  Undo2,
  Monitor,
  Lock,
  Sparkles
} from 'lucide-react';
import { syncEngine } from '../../services/syncEngine';
import { audioSynth } from '../../services/audioSynth';

export const KeyboardController: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const triggerFeedback = (action: string) => {
    audioSynth.playPreset('click');
    if (navigator.vibrate) navigator.vibrate(15);
    setLastAction(action);
    setTimeout(() => setLastAction(null), 800);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText) return;
    syncEngine.sendCommand({
      id: `txt_${Date.now()}`,
      type: 'TEXT_INPUT',
      timestamp: Date.now(),
      payload: { text: inputText },
    });
    triggerFeedback(`Texto enviado: "${inputText}"`);
    setInputText('');
  };

  const handleKeyPress = (key: string, code?: string) => {
    triggerFeedback(`Tecla ${key}`);
    syncEngine.sendCommand({
      id: `key_${Date.now()}`,
      type: 'KEY_DOWN',
      timestamp: Date.now(),
      payload: { key, code },
    });
  };

  const handleHotkey = (action: string, shortcut: string) => {
    triggerFeedback(`Atalho ${shortcut}`);
    syncEngine.sendCommand({
      id: `hotkey_${Date.now()}`,
      type: 'HOTKEY',
      timestamp: Date.now(),
      payload: { action, key: shortcut },
    });
  };

  const handleMedia = (action: string) => {
    if (action === 'PLAY_PAUSE') setIsPlaying(!isPlaying);
    triggerFeedback(`Mídia ${action}`);
    syncEngine.sendCommand({
      id: `media_${Date.now()}`,
      type: 'MEDIA_CONTROL',
      timestamp: Date.now(),
      payload: { action },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-xl mx-auto p-3 sm:p-4 gap-3 select-none overflow-y-auto">
      {/* Live typing buffer input */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-cyan-600" />
            <span>Digitação Rápida para o Computador</span>
          </label>
          {lastAction && (
            <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200 font-semibold">
              {lastAction}
            </span>
          )}
        </div>

        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite aqui para enviar ao PC..."
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-cyan-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>
      </div>

      {/* Quick shortcuts bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Atalhos de Sistema (Windows / Mac)
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            onClick={() => handleHotkey('COPY', 'Ctrl+C')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <Copy className="w-4 h-4 text-cyan-600" />
            <span>Copiar</span>
          </button>
          <button
            onClick={() => handleHotkey('PASTE', 'Ctrl+V')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <Clipboard className="w-4 h-4 text-cyan-600" />
            <span>Colar</span>
          </button>
          <button
            onClick={() => handleHotkey('UNDO', 'Ctrl+Z')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <Undo2 className="w-4 h-4 text-cyan-600" />
            <span>Desfazer</span>
          </button>
          <button
            onClick={() => handleHotkey('SWITCH_WINDOW', 'Alt+Tab')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <span className="font-mono text-[10px] text-amber-700 font-bold">Alt+Tab</span>
            <span>Janelas</span>
          </button>
          <button
            onClick={() => handleHotkey('SHOW_DESKTOP', 'Win+D')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <Monitor className="w-4 h-4 text-purple-600" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => handleHotkey('LOCK', 'Win+L')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs font-semibold border border-slate-200 flex flex-col items-center gap-1 transition-all"
          >
            <Lock className="w-4 h-4 text-red-600" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>

      {/* Media and Volume controls */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 shrink-0">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Controle Multimídia e Volume
        </span>
        <div className="grid grid-cols-6 gap-2">
          <button
            onClick={() => handleMedia('MUTE')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Mudo"
          >
            <VolumeX className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={() => handleMedia('VOLUME_DOWN')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Diminuir Volume"
          >
            <Volume1 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => handleMedia('VOLUME_UP')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Aumentar Volume"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => handleMedia('PREV')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Faixa Anterior"
          >
            <SkipBack className="w-4 h-4 text-cyan-600" />
          </button>
          <button
            onClick={() => handleMedia('PLAY_PAUSE')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-cyan-600" />}
          </button>
          <button
            onClick={() => handleMedia('NEXT')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 flex items-center justify-center"
            title="Próxima Faixa"
          >
            <SkipForward className="w-4 h-4 text-cyan-600" />
          </button>
        </div>
      </div>

      {/* Virtual Keypad and Navigation Arrows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-[160px]">
        {/* Function Keys */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Teclas de Comando
          </span>
          <div className="grid grid-cols-3 gap-2">
            {['Esc', 'Tab', 'Enter', 'Backspace', 'Delete', 'Espaço'].map((k) => (
              <button
                key={k}
                onClick={() => handleKeyPress(k, k)}
                className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Directional Pad */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Setas Direcionais
          </span>
          <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
            <div />
            <button
              onClick={() => handleKeyPress('ArrowUp', 'ArrowUp')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-200 flex items-center justify-center"
            >
              <ArrowUp className="w-4 h-4 text-cyan-600" />
            </button>
            <div />
            <button
              onClick={() => handleKeyPress('ArrowLeft', 'ArrowLeft')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-200 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-600" />
            </button>
            <button
              onClick={() => handleKeyPress('ArrowDown', 'ArrowDown')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-200 flex items-center justify-center"
            >
              <ArrowDown className="w-4 h-4 text-cyan-600" />
            </button>
            <button
              onClick={() => handleKeyPress('ArrowRight', 'ArrowRight')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-200 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 text-cyan-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
