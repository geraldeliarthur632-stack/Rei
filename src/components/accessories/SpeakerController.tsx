import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  Radio, 
  Sliders, 
  Sparkles, 
  Play, 
  Square,
  Activity,
  Bell
} from 'lucide-react';
import { audioSynth } from '../../services/audioSynth';
import { syncEngine } from '../../services/syncEngine';

export const SpeakerController: React.FC = () => {
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeFrequency, setActiveFrequency] = useState<number>(440);
  const [isStreamingMic, setIsStreamingMic] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const data = audioSynth.getVisualizerData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / data.length) * 1.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height * 0.9;
        
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#0284c7');
        gradient.addColorStop(1, '#4f46e5');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    audioSynth.setVolume(isMuted ? 0 : v);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioSynth.setVolume(next ? 0 : volume);
  };

  const playTone = (freq: number) => {
    setActiveFrequency(freq);
    audioSynth.playTone(freq, 'sine', 300);
    syncEngine.sendCommand({
      id: `snd_${Date.now()}`,
      type: 'AUDIO_PLAY_TONE',
      timestamp: Date.now(),
      payload: { frequency: freq, volume, duration: 300 },
    });
  };

  const playPreset = (preset: 'click' | 'alert' | 'notification' | 'laser' | 'sub_bass') => {
    audioSynth.playPreset(preset);
    syncEngine.sendCommand({
      id: `snd_preset_${Date.now()}`,
      type: 'AUDIO_PLAY_TONE',
      timestamp: Date.now(),
      payload: { typeAudio: preset, volume },
    });
  };

  const toggleMicStream = async () => {
    if (isStreamingMic) {
      setIsStreamingMic(false);
      syncEngine.sendCommand({
        id: `mic_stop_${Date.now()}`,
        type: 'AUDIO_STREAM_STOP',
        timestamp: Date.now(),
        payload: {},
      });
    } else {
      const stream = await syncEngine.startAudioStream();
      if (stream) {
        setIsStreamingMic(true);
        syncEngine.sendCommand({
          id: `mic_start_${Date.now()}`,
          type: 'AUDIO_STREAM_START',
          timestamp: Date.now(),
          payload: {},
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-xl mx-auto p-3 sm:p-4 gap-3.5 select-none overflow-y-auto">
      {/* Header status */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Caixa de Som Remota Ativa</h3>
              <p className="text-xs text-slate-500">Web Audio API de Baixa Latência</p>
            </div>
          </div>

          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border transition-colors ${
              isMuted ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-amber-600" />}
          </button>
        </div>

        {/* Real-time spectrum canvas */}
        <div className="h-20 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center p-2 overflow-hidden shadow-inner">
          <canvas ref={canvasRef} width={380} height={80} className="w-full h-full" />
        </div>

        {/* Master Volume */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="font-semibold">Volume Principal</span>
            <span className="font-mono text-amber-700 font-bold">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Mic streaming transmission */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isStreamingMic ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs">Microfone Transmissor</p>
            <p className="text-[11px] text-slate-500">Transmitir voz do celular para o PC</p>
          </div>
        </div>

        <button
          onClick={toggleMicStream}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isStreamingMic 
              ? 'bg-red-600 text-white shadow-xs' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          {isStreamingMic ? 'Parar Microfone' : 'Ativar Microfone'}
        </button>
      </div>

      {/* Soundboard and Synthesizer */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Soundboard Instantâneo
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'notification', label: 'Notificação', note: '880 Hz' },
            { id: 'alert', label: 'Alerta Sonoro', note: 'Sirene' },
            { id: 'click', label: 'Clique Tátil', note: 'Curto' },
            { id: 'laser', label: 'Laser Sci-Fi', note: 'Sweep' },
            { id: 'sub_bass', label: 'Grave Sub-Bass', note: '65 Hz' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => playPreset(item.id as any)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 hover:border-amber-400 text-left transition-all flex flex-col justify-between"
            >
              <span className="font-bold text-slate-800 text-xs">{item.label}</span>
              <span className="font-mono text-[10px] text-amber-700 font-semibold mt-0.5">{item.note}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pitch Frequencies */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Frequência do Sintetizador</span>
          <span className="font-mono text-cyan-700 font-bold">{activeFrequency} Hz</span>
        </div>
        <div className="flex gap-1.5">
          {[220, 440, 528, 880, 1000].map((f) => (
            <button
              key={f}
              onClick={() => playTone(f)}
              className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 active:scale-95 text-xs font-semibold text-slate-700 border border-slate-200 transition-all"
            >
              {f}Hz
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
