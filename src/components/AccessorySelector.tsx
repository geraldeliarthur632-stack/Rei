import React from 'react';
import { 
  MousePointer, 
  Keyboard, 
  Volume2, 
  Monitor, 
  Layers, 
  ArrowLeft, 
  ArrowRight,
  Compass,
  Touchpad,
  Sliders,
  Sparkles
} from 'lucide-react';
import { AccessoryType } from '../types/sync';

interface AccessorySelectorProps {
  onSelectAccessory: (type: AccessoryType) => void;
  onBack: () => void;
}

export const AccessorySelector: React.FC<AccessorySelectorProps> = ({ onSelectAccessory, onBack }) => {
  const accessories: {
    type: AccessoryType;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
    tags: string[];
  }[] = [
    {
      type: 'all_in_one',
      title: 'Tudo-em-Um (Super Controle)',
      subtitle: 'Mouse Touchpad + Teclado + Atalhos',
      description: 'A interface mais completa: trackpad responsivo com cliques, atalhos rápidos do Windows/Mac e digitação em tempo real na mesma tela.',
      icon: <Layers className="w-5 h-5 text-cyan-600" />,
      color: 'border-slate-200 hover:border-cyan-500 bg-white hover:shadow-md',
      badge: 'Recomendado',
      tags: ['Touchpad', 'Teclado', 'Atalhos', 'Mídia'],
    },
    {
      type: 'mouse_keyboard',
      title: 'Mouse (Giroscópio ou Touchpad)',
      subtitle: 'Controle de cursor com sensores ou dedo',
      description: 'Use os sensores de movimento apontando o celular no ar, ou deslize o dedo suavemente sobre a tela como touchpad.',
      icon: <MousePointer className="w-5 h-5 text-emerald-600" />,
      color: 'border-slate-200 hover:border-emerald-500 bg-white hover:shadow-md',
      badge: 'Alta Precisão',
      tags: ['Air Mouse 3D', 'Touchpad', 'Clique Duplo', 'Scroll'],
    },
    {
      type: 'keyboard',
      title: 'Teclado Remoto',
      subtitle: 'Digitação direta e teclas especiais',
      description: 'Teclado virtual completo com suporte a acentos, teclas de função (F1-F12), setas, atalhos como Ctrl+C/V e multimídia.',
      icon: <Keyboard className="w-5 h-5 text-purple-600" />,
      color: 'border-slate-200 hover:border-purple-500 bg-white hover:shadow-md',
      badge: 'Produtividade',
      tags: ['Ctrl+C/V', 'Multimídia', 'Setas', 'Numpad'],
    },
    {
      type: 'speaker',
      title: 'Caixa de Som Remota',
      subtitle: 'Transmissão de áudio sem fio',
      description: 'Transforme seu celular ou caixa conectada em um alto-falante sem fio. Ouça o áudio do computador ou envie efeitos sonoros.',
      icon: <Volume2 className="w-5 h-5 text-amber-600" />,
      color: 'border-slate-200 hover:border-amber-500 bg-white hover:shadow-md',
      badge: 'Som Sem Fio',
      tags: ['Streaming', 'Soundboard', 'Visualizador', 'Web Audio'],
    },
    {
      type: 'extra_monitor',
      title: 'Monitor Extra (Segunda Tela)',
      subtitle: 'Extensão ou espelhamento de tela',
      description: 'Use a tela do celular ou tablet como uma segunda tela com baixa latência para ver janelas, apresentações ou pré-visualizações.',
      icon: <Monitor className="w-5 h-5 text-sky-600" />,
      color: 'border-slate-200 hover:border-sky-500 bg-white hover:shadow-md',
      badge: 'Display Sem Fio',
      tags: ['Extensão', 'HD Stream', 'Tela Cheia', 'Baixo Delay'],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para escolha de modo</span>
        </button>
        <div className="text-right">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">Passo 1 de 2</span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Qual acessório este dispositivo será?</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Após selecionar, você irá escanear o QR Code, digitar o código PIN ou conectar via Cabo USB.
        </p>
      </div>

      {/* Accessories list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {accessories.map((item) => (
          <div
            key={item.type}
            onClick={() => onSelectAccessory(item.type)}
            className={`group relative p-4.5 rounded-2xl border-2 ${item.color} shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer text-left flex flex-col justify-between`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {item.badge}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 group-hover:text-cyan-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-medium text-slate-500">{item.subtitle}</p>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-cyan-600 group-hover:translate-x-1 transition-transform">
                <span>Escolher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
