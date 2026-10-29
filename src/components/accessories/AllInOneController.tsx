import React, { useState } from 'react';
import { 
  Layers, 
  MousePointer, 
  Keyboard, 
  Volume2, 
  Monitor, 
  Move, 
  Compass, 
  Copy, 
  Clipboard, 
  Sliders,
  Play,
  Pause,
  VolumeX,
  Volume1
} from 'lucide-react';
import { MouseController } from './MouseController';
import { KeyboardController } from './KeyboardController';
import { SpeakerController } from './SpeakerController';
import { MonitorController } from './MonitorController';

interface AllInOneControllerProps {
  remoteStream?: MediaStream | null;
  requestSensorPermission?: () => void;
}

export const AllInOneController: React.FC<AllInOneControllerProps> = ({ 
  remoteStream, 
  requestSensorPermission 
}) => {
  const [activeTab, setActiveTab] = useState<'mouse' | 'keyboard' | 'speaker' | 'monitor'>('mouse');

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-w-xl mx-auto select-none">
      {/* Top quick tab bar */}
      <div className="px-3 pt-2 shrink-0">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white border border-slate-200 shadow-xs text-xs">
          <button
            onClick={() => setActiveTab('mouse')}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'mouse'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="text-[11px]">Mouse</span>
          </button>

          <button
            onClick={() => setActiveTab('keyboard')}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'keyboard'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="text-[11px]">Teclado</span>
          </button>

          <button
            onClick={() => setActiveTab('speaker')}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'speaker'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Caixa Som</span>
          </button>

          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'monitor'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="text-[11px]">Monitor</span>
          </button>
        </div>
      </div>

      {/* Tab contents */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'mouse' && <MouseController requestSensorPermission={requestSensorPermission} />}
        {activeTab === 'keyboard' && <KeyboardController />}
        {activeTab === 'speaker' && <SpeakerController />}
        {activeTab === 'monitor' && <MonitorController remoteStream={remoteStream} />}
      </div>
    </div>
  );
};
