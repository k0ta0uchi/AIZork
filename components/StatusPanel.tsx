import React from 'react';
import { GameState, Language } from '../types';

interface StatusPanelProps {
  gameState: GameState | null;
  enableImages: boolean;
  onToggleImages: () => void;
  enableSound: boolean;
  onToggleSound: () => void;
  enableMusic: boolean;
  onToggleMusic: () => void;
  enableCRT: boolean;
  onToggleCRT: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSaveData: boolean;
  isOpen?: boolean; // Mobile state
  onClose?: () => void; // Mobile close handler
  onOpenMap: () => void;
}

// Moved outside StatusPanel to avoid TypeScript inference issues with props
// Made children optional (?) to resolve TypeScript error "Property 'children' is missing"
const PanelSection = ({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) => (
  <div className={`border-b-2 border-green-900/40 pb-4 mb-4 ${className}`}>
    <h3 className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center">
      <span className="w-2 h-2 bg-green-900 rounded-full mr-2"></span>
      {title}
    </h3>
    {children}
  </div>
);

const ToggleSwitch = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <div className="flex items-center justify-between mb-2 group cursor-pointer" onClick={onClick}>
    <span className="text-green-500/80 text-xs font-mono group-hover:text-green-300 transition-colors">{label}</span>
    <div className="relative w-12 h-6 bg-black border border-green-800 rounded-sm overflow-hidden">
      <div className={`absolute top-0 bottom-0 w-6 transition-all duration-200 flex items-center justify-center text-[9px] font-bold ${active ? 'right-0 bg-green-900 text-green-100' : 'left-0 bg-zinc-900 text-zinc-500'}`}>
        {active ? 'ON' : 'OFF'}
      </div>
    </div>
  </div>
);

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  gameState, 
  enableImages, 
  onToggleImages,
  enableSound,
  onToggleSound,
  enableMusic,
  onToggleMusic,
  enableCRT,
  onToggleCRT,
  language,
  onToggleLanguage,
  onSave,
  onLoad,
  hasSaveData,
  isOpen = false,
  onClose,
  onOpenMap
}) => {
  
  // Helper for labels
  const L = (ja: string, en: string) => language === 'ja' ? ja : en;

  const LangSwitch = () => (
    <div className="flex items-center justify-between mb-2 group cursor-pointer" onClick={onToggleLanguage}>
      <span className="text-green-500/80 text-xs font-mono group-hover:text-green-300 transition-colors">LANGUAGE</span>
      <div className="flex bg-black border border-green-800 rounded-sm overflow-hidden">
        <div className={`px-2 py-1 text-[9px] font-bold transition-colors ${language === 'en' ? 'bg-green-900 text-green-100' : 'text-green-800'}`}>EN</div>
        <div className={`px-2 py-1 text-[9px] font-bold transition-colors ${language === 'ja' ? 'bg-green-900 text-green-100' : 'text-green-800'}`}>JP</div>
      </div>
    </div>
  );

  // Common wrapper styles
  const wrapperClasses = `
    flex flex-col bg-zinc-950 h-full shrink-0
    fixed inset-y-0 right-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:w-72 md:border-l-2 md:border-green-900/60
    ${isOpen ? 'translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]' : 'translate-x-full'}
  `;

  // Offline State Render
  if (!gameState) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={onClose} />}
        <div className={wrapperClasses}>
          <div className="p-1 bg-green-900/20 mb-2 mx-2 mt-2 border border-green-900/50">
            <div className="bg-black p-2 border border-green-900/30 text-center">
              <span className="text-green-600 text-xs tracking-widest animate-pulse">SYSTEM STANDBY</span>
            </div>
          </div>
          <div className="p-4 flex-1">
             <PanelSection title="Config">
                <ToggleSwitch label="VISUAL MODE" active={enableImages} onClick={onToggleImages} />
                <ToggleSwitch label="SOUND FX" active={enableSound} onClick={onToggleSound} />
                <ToggleSwitch label="MUSIC (BGM)" active={enableMusic} onClick={onToggleMusic} />
                <ToggleSwitch label="CRT EFFECT" active={enableCRT} onClick={onToggleCRT} />
                <LangSwitch />
             </PanelSection>
             <PanelSection title="Data Mgmt">
               <div className="grid grid-cols-2 gap-2">
                 <button onClick={() => { onSave(); if(onClose) onClose(); }} disabled className="opacity-50 border border-green-900 text-green-800 text-xs py-2">SAVE</button>
                 <button onClick={() => { onLoad(); if(onClose) onClose(); }} className="border border-green-800 hover:bg-green-900/30 text-green-500 text-xs py-2">LOAD</button>
               </div>
             </PanelSection>
          </div>
        </div>
      </>
    );
  }

  // Active Game State
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={onClose} />}
      
      <div className={`${wrapperClasses} font-mono text-green-500`}>
        {/* Header Block */}
        <div className="p-3 bg-black border-b border-green-900 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-green-400 uppercase tracking-widest">STATUS_MOD</h2>
            <span className="text-[10px] text-green-800">V.2.5.0-RC</span>
          </div>
          <button onClick={onClose} className="md:hidden text-green-600 hover:text-green-300">[X]</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Location Module */}
          <PanelSection title={L('LOCATION DATA', 'LOCATION DATA')}>
            <div className="bg-black border border-green-900/60 p-3 mb-2 shadow-[0_0_10px_rgba(20,83,45,0.2)_inset]">
              <p className="text-lg font-bold text-green-300 leading-tight shadow-green-900 drop-shadow-sm">{gameState.locationName}</p>
            </div>
            <button 
              onClick={() => { onOpenMap(); if(onClose) onClose(); }}
              className="w-full border border-green-700 bg-green-900/10 hover:bg-green-900/30 text-green-400 py-1 text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              ACCESS MAP
            </button>
          </PanelSection>

          {/* Vitals Module */}
          <PanelSection title={L('VITALS', 'VITALS')}>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="bg-black p-2 border-l-2 border-green-600">
                <span className="text-[9px] text-green-700 block mb-1">SCORE</span>
                <span className="text-xl font-bold text-green-200">{gameState.score}</span>
              </div>
              <div className="bg-black p-2 border-l-2 border-green-600">
                <span className="text-[9px] text-green-700 block mb-1">MOVES</span>
                <span className="text-xl font-bold text-green-200">{gameState.moves}</span>
              </div>
            </div>
            {/* Fake data visualizer */}
            <div className="flex gap-0.5 mt-2 opacity-50">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className={`h-1 flex-1 ${i < (gameState.moves % 10) + 1 ? 'bg-green-500' : 'bg-green-900'}`}></div>
               ))}
            </div>
          </PanelSection>

          {/* Inventory Module */}
          <PanelSection title={L('INVENTORY', 'INVENTORY')}>
            <div className="min-h-[80px]">
              {gameState.inventory.length === 0 ? (
                <p className="text-green-900 italic text-xs text-center py-4">-- NO ITEMS CARRIED --</p>
              ) : (
                <ul className="space-y-1">
                  {gameState.inventory.map((item, idx) => (
                    <li key={idx} className="text-xs text-green-400 flex items-center bg-green-900/10 px-2 py-1 border-l-2 border-green-800">
                      <span className="w-1 h-1 bg-green-600 mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PanelSection>

          {/* Settings Module */}
          <PanelSection title="CONFIG">
             <ToggleSwitch label="VISUALS" active={enableImages} onClick={onToggleImages} />
             <ToggleSwitch label="SOUND" active={enableSound} onClick={onToggleSound} />
             <ToggleSwitch label="MUSIC" active={enableMusic} onClick={onToggleMusic} />
             <ToggleSwitch label="CRT EFFECT" active={enableCRT} onClick={onToggleCRT} />
             <LangSwitch />
          </PanelSection>

          {/* System Module */}
          <PanelSection title="SYSTEM" className="border-none">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { onSave(); if(onClose) onClose(); }}
                disabled={!gameState}
                className="border border-green-800 hover:bg-green-900/30 text-green-400 text-xs py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase"
              >
                Save State
              </button>
              <button 
                onClick={() => { onLoad(); if(onClose) onClose(); }}
                disabled={!hasSaveData}
                className="border border-green-800 hover:bg-green-900/30 text-green-400 text-xs py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase"
              >
                Load State
              </button>
            </div>
            {hasSaveData && <div className="text-[9px] text-green-600 text-center mt-1">:: MEMORY CARD DETECTED ::</div>}
          </PanelSection>

        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-green-900 bg-black text-[9px] text-green-900 text-center font-mono">
           ZORK ENGINE ONLINE<br/>
           GEMINI-2.5-FLASH CONNECTED
        </div>
      </div>
    </>
  );
};