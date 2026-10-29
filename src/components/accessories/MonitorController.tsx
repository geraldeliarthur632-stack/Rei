import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Maximize2, 
  Minimize2, 
  Share2, 
  RefreshCw, 
  Zap, 
  Tv, 
  Settings2,
  Sparkles
} from 'lucide-react';
import { syncEngine } from '../../services/syncEngine';

interface MonitorControllerProps {
  remoteStream?: MediaStream | null;
}

export const MonitorController: React.FC<MonitorControllerProps> = ({ remoteStream }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scaleMode, setScaleMode] = useState<'fit' | 'fill'>('fit');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [remoteStream]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStartScreenShare = async () => {
    const stream = await syncEngine.startScreenShare();
    if (stream) {
      setIsBroadcasting(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-[calc(100vh-4.5rem)] max-w-4xl mx-auto p-3 sm:p-4 gap-3 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 max-w-none h-screen bg-black p-0' : ''
      }`}
    >
      {/* Controls Bar */}
      {!isFullscreen && (
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Tv className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Monitor Extra Sem Fio</h3>
              <p className="text-[10px] text-slate-500">Streaming 60 FPS com Baixa Latência</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScaleMode(scaleMode === 'fit' ? 'fill' : 'fit')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 text-[11px]"
            >
              Ajuste: {scaleMode === 'fit' ? 'Conter' : 'Preencher'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-cyan-700 border border-slate-200"
              title="Tela Cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Display Area */}
      <div className="relative flex-1 rounded-2xl bg-slate-900 border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-md">
        {remoteStream || isBroadcasting ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full ${scaleMode === 'fit' ? 'object-contain' : 'object-cover'}`}
          />
        ) : (
          <div className="p-6 text-center space-y-3 max-w-md bg-white rounded-2xl border border-slate-200 m-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600 shadow-xs">
              <Monitor className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Aguardando Transmissão de Vídeo</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No PC conectado, clique em <strong>Compartilhar Tela</strong> para que este celular se torne um monitor extra, ou clique abaixo para transmitir esta tela para o PC.
              </p>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleStartScreenShare}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Transmitir Esta Tela para o PC</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Fullscreen button when fullscreen */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md z-50"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
