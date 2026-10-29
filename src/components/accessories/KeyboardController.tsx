import React, { useState, useRef, useEffect } from 'react';
import { 
  Keyboard as KeyboardIcon, 
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
  Delete,
  Copy,
  Clipboard,
  Undo2,
  Monitor,
  Lock,
  Sparkles,
  Smartphone,
  ChevronDown,
  Hash,
  Sliders,
  Maximize2,
  Check
} from 'lucide-react';
import { syncEngine } from '../../services/syncEngine';
import { audioSynth } from '../../services/audioSynth';
import { permissionsService } from '../../services/permissionsService';

type KeyboardLayoutMode = 'qwerty' | 'symbols' | 'fn_keys' | 'gamer';

export const KeyboardController: React.FC = () => {
  const [layoutMode, setLayoutMode] = useState<KeyboardLayoutMode>('qwerty');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isCtrlActive, setIsCtrlActive] = useState(false);
  const [isAltActive, setIsAltActive] = useState(false);
  const [isPlayingMedia, setIsPlayingMedia] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Native phone keyboard input state
  const [showNativeInput, setShowNativeInput] = useState(false);
  const [nativeInputValue, setNativeInputValue] = useState('');
  const nativeInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus native input when opened
  useEffect(() => {
    if (showNativeInput && nativeInputRef.current) {
      nativeInputRef.current.focus();
    }
  }, [showNativeInput]);

  const triggerFeedback = (action: string) => {
    audioSynth.playPreset('click');
    permissionsService.triggerHaptic(12);
    setLastAction(action);
    setTimeout(() => setLastAction(null), 900);
  };

  // Dispatch key press to SyncEngine
  const handleVirtualKey = (key: string, code?: string, printableChar?: string) => {
    // If Shift is active (and not Caps Lock), toggle Shift off after one non-modifier key
    if (isShiftActive && !isCapsLock && key !== 'Shift' && key !== 'Caps') {
      setIsShiftActive(false);
    }

    const effectiveKey = printableChar !== undefined 
      ? printableChar 
      : (isShiftActive || isCapsLock) ? key.toUpperCase() : key;

    triggerFeedback(`Tecla ${effectiveKey}`);

    // Send KEY_DOWN event
    syncEngine.sendCommand({
      id: `key_${Date.now()}`,
      type: 'KEY_DOWN',
      timestamp: Date.now(),
      payload: { 
        key: effectiveKey, 
        code: code || effectiveKey,
        shiftKey: isShiftActive || isCapsLock,
        ctrlKey: isCtrlActive,
        altKey: isAltActive,
      },
    });

    // Also send character as text if single printable character
    if (effectiveKey.length === 1 && !isCtrlActive && !isAltActive) {
      syncEngine.sendCommand({
        id: `txt_${Date.now()}`,
        type: 'TEXT_INPUT',
        timestamp: Date.now(),
        payload: { text: effectiveKey },
      });
    }
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
    if (action === 'PLAY_PAUSE') setIsPlayingMedia(!isPlayingMedia);
    triggerFeedback(`Mídia ${action}`);
    syncEngine.sendCommand({
      id: `media_${Date.now()}`,
      type: 'MEDIA_CONTROL',
      timestamp: Date.now(),
      payload: { action },
    });
  };

  // Native phone keyboard stream
  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const prevVal = nativeInputValue;
    setNativeInputValue(val);

    if (val.length > prevVal.length) {
      // Character typed
      const addedChar = val.slice(prevVal.length);
      triggerFeedback(`"${addedChar}"`);
      syncEngine.sendCommand({
        id: `txt_${Date.now()}`,
        type: 'TEXT_INPUT',
        timestamp: Date.now(),
        payload: { text: addedChar },
      });
    } else if (val.length < prevVal.length) {
      // Backspace pressed on phone keyboard
      triggerFeedback('Apagar');
      syncEngine.sendCommand({
        id: `key_bs_${Date.now()}`,
        type: 'KEY_DOWN',
        timestamp: Date.now(),
        payload: { key: 'Backspace', code: 'Backspace' },
      });
    }
  };

  const handleSendEntireBuffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nativeInputValue.trim()) return;

    triggerFeedback(`Enviado bloco: "${nativeInputValue}"`);
    syncEngine.sendCommand({
      id: `txt_${Date.now()}`,
      type: 'TEXT_INPUT',
      timestamp: Date.now(),
      payload: { text: nativeInputValue },
    });
    setNativeInputValue('');
  };

  // QWERTY rows definition
  const qwertyRow1 = [
    { key: '1', shift: '!' },
    { key: '2', shift: '@' },
    { key: '3', shift: '#' },
    { key: '4', shift: '$' },
    { key: '5', shift: '%' },
    { key: '6', shift: '¨' },
    { key: '7', shift: '&' },
    { key: '8', shift: '*' },
    { key: '9', shift: '(' },
    { key: '0', shift: ')' },
    { key: '-', shift: '_' },
    { key: '=', shift: '+' },
  ];

  const qwertyRow2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'];
  const qwertyRow3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ç', '~', '\''];
  const qwertyRow4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', ';', '/'];

  const symbolsList = [
    '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+',
    '{', '}', '[', ']', '|', '\\', ':', ';', '"', '\'', '<', '>',
    '?', '/', '~', '`', '=', '-', '€', '£', '¥', '§', '°', '±'
  ];

  const fnKeysList = [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
    'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PrtScn', 'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-2xl mx-auto p-2 sm:p-3.5 gap-2 select-none overflow-y-auto">
      {/* Top Bar: Active Feedback & Native Keyboard Toggle */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <KeyboardIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-slate-900">Teclado Virtual Real</span>
              {lastAction && (
                <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.2 rounded-full border border-cyan-200 font-bold animate-pulse">
                  {lastAction}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">Controla PC ou outro Celular em tempo real</p>
          </div>
        </div>

        {/* Button to toggle Smartphone Native Software Keyboard */}
        <button
          onClick={() => setShowNativeInput(!showNativeInput)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
            showNativeInput
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border border-indigo-200'
          }`}
          title="Usar teclado nativo do celular (Gboard/iOS com corretor e voz)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="text-[11px]">{showNativeInput ? 'Fechar Teclado do Celular' : 'Abrir Teclado do Celular'}</span>
        </button>
      </div>

      {/* Native Smartphone Keyboard Drawer / Live Buffer Input */}
      {showNativeInput && (
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-xs space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Digite no celular (suporta voz, corretor e emojis):</span>
            </label>
            <span className="text-[10px] font-medium text-indigo-700">Transmissão em Tempo Real</span>
          </div>

          <form onSubmit={handleSendEntireBuffer} className="flex gap-2">
            <input
              ref={nativeInputRef}
              type="text"
              value={nativeInputValue}
              onChange={handleNativeInputChange}
              placeholder="Digite aqui para enviar tecla por tecla..."
              className="flex-1 bg-white border border-indigo-300 focus:border-indigo-600 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none shadow-xs"
              autoComplete="off"
              autoCorrect="on"
            />
            <button
              type="submit"
              disabled={!nativeInputValue.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Bloco</span>
            </button>
          </form>
        </div>
      )}

      {/* Layout Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs shrink-0">
        <div className="grid grid-cols-4 gap-1 w-full">
          <button
            onClick={() => setLayoutMode('qwerty')}
            className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
              layoutMode === 'qwerty' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>QWERTY</span>
          </button>

          <button
            onClick={() => setLayoutMode('symbols')}
            className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
              layoutMode === 'symbols' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>123 &amp; Símbolos</span>
          </button>

          <button
            onClick={() => setLayoutMode('fn_keys')}
            className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
              layoutMode === 'fn_keys' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>F1 - F12 &amp; Edição</span>
          </button>

          <button
            onClick={() => setLayoutMode('gamer')}
            className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
              layoutMode === 'gamer' ? 'bg-white text-cyan-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Gamer WASD</span>
          </button>
        </div>
      </div>

      {/* Quick Shortcuts Bar (Windows, Mac, Phone) */}
      <div className="px-2 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1 text-[11px] overflow-x-auto shrink-0">
        <span className="font-bold text-slate-500 uppercase text-[9px] shrink-0 mr-1">Atalhos:</span>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => handleHotkey('COPY', 'Ctrl+C')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1"
          >
            <Copy className="w-3 h-3 text-cyan-600" />
            <span>Ctrl+C</span>
          </button>
          <button
            onClick={() => handleHotkey('PASTE', 'Ctrl+V')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1"
          >
            <Clipboard className="w-3 h-3 text-cyan-600" />
            <span>Ctrl+V</span>
          </button>
          <button
            onClick={() => handleHotkey('UNDO', 'Ctrl+Z')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1"
          >
            <Undo2 className="w-3 h-3 text-cyan-600" />
            <span>Ctrl+Z</span>
          </button>
          <button
            onClick={() => handleHotkey('SELECT_ALL', 'Ctrl+A')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200"
          >
            <span>Ctrl+A</span>
          </button>
          <button
            onClick={() => handleHotkey('SWITCH_WINDOW', 'Alt+Tab')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200"
          >
            <span>Alt+Tab</span>
          </button>
          <button
            onClick={() => handleHotkey('SHOW_DESKTOP', 'Win+D')}
            className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1"
          >
            <Monitor className="w-3 h-3 text-purple-600" />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* Main Virtual Keyboard Rendering */}
      <div className="flex-1 rounded-2xl bg-slate-100/90 border-2 border-slate-300 p-2 sm:p-3 shadow-inner flex flex-col justify-between gap-1.5 select-none touch-manipulation">
        {/* LAYOUT 1: FULL QWERTY KEYBOARD */}
        {layoutMode === 'qwerty' && (
          <div className="flex flex-col justify-between h-full gap-1.5">
            {/* Row 1: Numbers & Shift characters */}
            <div className="flex gap-1 justify-between">
              <button
                onClick={() => handleVirtualKey('Escape', 'Escape')}
                className="flex-1 py-2 sm:py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                Esc
              </button>
              {qwertyRow1.map((item) => {
                const char = (isShiftActive || isCapsLock) ? item.shift : item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleVirtualKey(char, `Digit${item.key}`, char)}
                    className="flex-1 py-2 sm:py-2.5 rounded-lg bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-800 text-xs sm:text-sm font-semibold border border-slate-200 shadow-xs transition-transform active:scale-95 flex flex-col items-center justify-center"
                  >
                    <span className="text-[9px] text-slate-400 leading-none">{item.shift}</span>
                    <span className="leading-none">{item.key}</span>
                  </button>
                );
              })}
              <button
                onClick={() => handleVirtualKey('Backspace', 'Backspace')}
                className="flex-1.5 py-2 sm:py-2.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-500 active:text-white text-rose-700 text-xs font-bold border border-rose-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                title="Apagar"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Row 2: QWERTY... */}
            <div className="flex gap-1 justify-between">
              <button
                onClick={() => handleVirtualKey('Tab', 'Tab')}
                className="w-10 sm:w-12 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                Tab
              </button>
              {qwertyRow2.map((k) => {
                const char = (isShiftActive || isCapsLock) ? k.toUpperCase() : k;
                return (
                  <button
                    key={k}
                    onClick={() => handleVirtualKey(char, `Key${k.toUpperCase()}`, char)}
                    className="flex-1 py-2.5 rounded-lg bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-900 text-sm sm:text-base font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                  >
                    {char}
                  </button>
                );
              })}
            </div>

            {/* Row 3: ASDFGHJKL... */}
            <div className="flex gap-1 justify-between">
              <button
                onClick={() => setIsCapsLock(!isCapsLock)}
                className={`w-11 sm:w-14 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95 flex items-center justify-center ${
                  isCapsLock 
                    ? 'bg-cyan-600 text-white ring-2 ring-cyan-300' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Caps
              </button>
              {qwertyRow3.map((k) => {
                const char = (isShiftActive || isCapsLock) ? k.toUpperCase() : k;
                return (
                  <button
                    key={k}
                    onClick={() => handleVirtualKey(char, `Key${k.toUpperCase()}`, char)}
                    className="flex-1 py-2.5 rounded-lg bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-900 text-sm sm:text-base font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                  >
                    {char}
                  </button>
                );
              })}
              <button
                onClick={() => handleVirtualKey('Enter', 'Enter')}
                className="w-12 sm:w-16 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center justify-center"
              >
                Enter
              </button>
            </div>

            {/* Row 4: ZXCVBNM... */}
            <div className="flex gap-1 justify-between">
              <button
                onClick={() => setIsShiftActive(!isShiftActive)}
                className={`w-12 sm:w-16 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95 flex items-center justify-center ${
                  isShiftActive 
                    ? 'bg-cyan-600 text-white ring-2 ring-cyan-300' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Shift
              </button>
              {qwertyRow4.map((k) => {
                const char = (isShiftActive || isCapsLock) ? k.toUpperCase() : k;
                return (
                  <button
                    key={k}
                    onClick={() => handleVirtualKey(char, `Key${k.toUpperCase()}`, char)}
                    className="flex-1 py-2.5 rounded-lg bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-900 text-sm sm:text-base font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                  >
                    {char}
                  </button>
                );
              })}
              <button
                onClick={() => handleVirtualKey('ArrowUp', 'ArrowUp')}
                className="w-10 sm:w-12 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 flex items-center justify-center shadow-xs active:scale-95"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Row 5: Modifiers, Wide Spacebar & Navigation */}
            <div className="flex gap-1 justify-between">
              <button
                onClick={() => setIsCtrlActive(!isCtrlActive)}
                className={`px-2.5 sm:px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95 ${
                  isCtrlActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Ctrl
              </button>
              <button
                onClick={() => handleVirtualKey('Meta', 'MetaLeft')}
                className="px-2 sm:px-2.5 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 text-[10px] sm:text-xs font-bold shadow-xs active:scale-95"
              >
                Win
              </button>
              <button
                onClick={() => setIsAltActive(!isAltActive)}
                className={`px-2.5 sm:px-3 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-xs transition-transform active:scale-95 ${
                  isAltActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Alt
              </button>

              {/* Wide Spacebar */}
              <button
                onClick={() => handleVirtualKey(' ', 'Space', ' ')}
                className="flex-1 py-2.5 rounded-lg bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center tracking-widest uppercase"
              >
                Espaço
              </button>

              <button
                onClick={() => handleVirtualKey('ArrowLeft', 'ArrowLeft')}
                className="w-10 sm:w-11 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 flex items-center justify-center shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVirtualKey('ArrowDown', 'ArrowDown')}
                className="w-10 sm:w-11 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 flex items-center justify-center shadow-xs active:scale-95"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleVirtualKey('ArrowRight', 'ArrowRight')}
                className="w-10 sm:w-11 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-cyan-500 active:text-white text-slate-800 flex items-center justify-center shadow-xs active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT 2: NUMBERS & SYMBOLS GRID */}
        {layoutMode === 'symbols' && (
          <div className="flex flex-col justify-between h-full gap-2">
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 flex-1">
              {symbolsList.map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleVirtualKey(sym, undefined, sym)}
                  className="py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-cyan-500 active:text-white text-slate-900 font-mono text-base font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleVirtualKey('Backspace', 'Backspace')}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Delete className="w-4 h-4" />
                <span>Apagar</span>
              </button>
              <button
                onClick={() => handleVirtualKey(' ', 'Space', ' ')}
                className="flex-2 py-2.5 rounded-xl bg-white text-slate-800 font-bold text-xs border border-slate-200 active:scale-95 uppercase tracking-wider"
              >
                Espaço
              </button>
              <button
                onClick={() => handleVirtualKey('Enter', 'Enter')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs active:scale-95"
              >
                Enter
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT 3: FUNCTION KEYS (F1 - F12) & SYSTEM EDIT */}
        {layoutMode === 'fn_keys' && (
          <div className="flex flex-col justify-between h-full gap-2">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 flex-1">
              {fnKeysList.map((fn) => (
                <button
                  key={fn}
                  onClick={() => handleVirtualKey(fn, fn)}
                  className="py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-indigo-600 active:text-white text-slate-800 font-mono text-xs sm:text-sm font-bold border border-slate-200 shadow-xs transition-transform active:scale-95 flex items-center justify-center"
                >
                  {fn}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button
                onClick={() => handleVirtualKey('Escape', 'Escape')}
                className="py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs active:scale-95"
              >
                Esc (Sair)
              </button>
              <button
                onClick={() => handleVirtualKey('Tab', 'Tab')}
                className="py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs active:scale-95"
              >
                Tab
              </button>
              <button
                onClick={() => handleVirtualKey('Enter', 'Enter')}
                className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs active:scale-95"
              >
                Enter
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT 4: GAMER / WASD & NAVIGATION CONTROLLER */}
        {layoutMode === 'gamer' && (
          <div className="flex flex-col justify-between h-full p-2 gap-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Controles Gamer / Setas Rápidas</span>
              <span className="text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                Latência Mínima
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 items-center">
              {/* WASD Pad */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Movimento WASD</span>
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div />
                  <button
                    onClick={() => handleVirtualKey('w', 'KeyW', 'w')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-slate-900 font-black text-lg border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    W
                  </button>
                  <div />
                  <button
                    onClick={() => handleVirtualKey('a', 'KeyA', 'a')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-slate-900 font-black text-lg border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleVirtualKey('s', 'KeyS', 's')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-slate-900 font-black text-lg border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    S
                  </button>
                  <button
                    onClick={() => handleVirtualKey('d', 'KeyD', 'd')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-slate-900 font-black text-lg border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    D
                  </button>
                </div>
              </div>

              {/* Arrow Keys Pad */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Setas Direcionais</span>
                <div className="grid grid-cols-3 gap-1.5 w-36">
                  <div />
                  <button
                    onClick={() => handleVirtualKey('ArrowUp', 'ArrowUp')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-cyan-700 border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <div />
                  <button
                    onClick={() => handleVirtualKey('ArrowLeft', 'ArrowLeft')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-cyan-700 border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVirtualKey('ArrowDown', 'ArrowDown')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-cyan-700 border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVirtualKey('ArrowRight', 'ArrowRight')}
                    className="h-12 rounded-xl bg-white active:bg-cyan-600 active:text-white text-cyan-700 border-2 border-slate-300 shadow-xs active:scale-95 flex items-center justify-center"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Gamer Actions Row */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleVirtualKey('Shift', 'ShiftLeft')}
                className="py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs active:scale-95"
              >
                Shift (Correr)
              </button>
              <button
                onClick={() => handleVirtualKey(' ', 'Space', ' ')}
                className="py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs active:scale-95"
              >
                Espaço (Pulo)
              </button>
              <button
                onClick={() => handleVirtualKey('Control', 'ControlLeft')}
                className="py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs active:scale-95"
              >
                Ctrl (Agachar)
              </button>
              <button
                onClick={() => handleVirtualKey('Escape', 'Escape')}
                className="py-2.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs active:scale-95"
              >
                Esc (Pausa)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Multimídia & Volume Toolbar */}
      <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-1 shrink-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1 hidden sm:inline">Mídia:</span>
        <div className="flex items-center justify-between w-full sm:w-auto gap-1">
          <button
            onClick={() => handleMedia('MUTE')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Mudo"
          >
            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
          </button>
          <button
            onClick={() => handleMedia('VOLUME_DOWN')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Diminuir Volume"
          >
            <Volume1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleMedia('VOLUME_UP')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Aumentar Volume"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
          </button>
          <button
            onClick={() => handleMedia('PREV')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Faixa Anterior"
          >
            <SkipBack className="w-3.5 h-3.5 text-cyan-600" />
          </button>
          <button
            onClick={() => handleMedia('PLAY_PAUSE')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Play / Pause"
          >
            {isPlayingMedia ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-cyan-600" />}
          </button>
          <button
            onClick={() => handleMedia('NEXT')}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200"
            title="Próxima Faixa"
          >
            <SkipForward className="w-3.5 h-3.5 text-cyan-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
