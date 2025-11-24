
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
  language: Language;
  onToggleLanguage: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSaveData: boolean;
  isOpen?: boolean; // Mobile state
  onClose?: () => void; // Mobile close handler
  onOpenMap: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  gameState, 
  enableImages, 
  onToggleImages,
  enableSound,
  onToggleSound,
  enableMusic,
  onToggleMusic,
  language,
  onToggleLanguage,
  onSave,
  onLoad,
  hasSaveData,
  isOpen = false,
  onClose,
  onOpenMap
}) => {
  
  const SettingsToggle = () => (
    <div className="px-4 py-2">
      <h3 className="text-xs uppercase text-green-700 mb-2 border-b border-green-900/50 pb-1">Settings</h3>
      
      {/* Visual Mode Toggle */}
      <div className="flex items-center justify-between group cursor-pointer mb-3" onClick={onToggleImages}>
        <span className="text-green-400 text-sm">Visual Mode</span>
        <div className="relative">
          <div className={`w-10 h-5 rounded-sm border border-green-700 transition-colors ${enableImages ? 'bg-green-900/50' : 'bg-black'}`}></div>
          <div 
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-green-500 rounded-sm transition-transform duration-200 ${
              enableImages ? 'translate-x-5 shadow-[0_0_5px_#22c55e]' : 'translate-x-0 opacity-50'
            }`}
          ></div>
        </div>
      </div>
      
      {/* Sound Toggle */}
      <div className="flex items-center justify-between group cursor-pointer mb-3" onClick={onToggleSound}>
        <span className="text-green-400 text-sm">Sound FX</span>
        <div className="relative">
          <div className={`w-10 h-5 rounded-sm border border-green-700 transition-colors ${enableSound ? 'bg-green-900/50' : 'bg-black'}`}></div>
          <div 
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-green-500 rounded-sm transition-transform duration-200 ${
              enableSound ? 'translate-x-5 shadow-[0_0_5px_#22c55e]' : 'translate-x-0 opacity-50'
            }`}
          ></div>
        </div>
      </div>

      {/* Music Toggle */}
      <div className="flex items-center justify-between group cursor-pointer mb-3" onClick={onToggleMusic}>
        <span className="text-green-400 text-sm">BGM</span>
        <div className="relative">
          <div className={`w-10 h-5 rounded-sm border border-green-700 transition-colors ${enableMusic ? 'bg-green-900/50' : 'bg-black'}`}></div>
          <div 
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-green-500 rounded-sm transition-transform duration-200 ${
              enableMusic ? 'translate-x-5 shadow-[0_0_5px_#22c55e]' : 'translate-x-0 opacity-50'
            }`}
          ></div>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="flex items-center justify-between group cursor-pointer" onClick={onToggleLanguage}>
        <span className="text-green-400 text-sm">Language</span>
        <div className="flex items-center space-x-2 text-xs font-bold font-mono">
          <span className={language === 'en' ? 'text-green-400' : 'text-green-900'}>EN</span>
          <div className="relative">
            <div className={`w-10 h-5 rounded-sm border border-green-700 bg-black`}></div>
            <div 
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-green-500 rounded-sm transition-transform duration-200 ${
                language === 'ja' ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </div>
          <span className={language === 'ja' ? 'text-green-400' : 'text-green-900'}>JP</span>
        </div>
      </div>
    </div>
  );

  const SystemControls = () => (
    <div className="px-4 py-2 mt-2">
      <h3 className="text-xs uppercase text-green-700 mb-2 border-b border-green-900/50 pb-1">System</h3>
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => { onSave(); if(onClose) onClose(); }}
          disabled={!gameState}
          className="bg-green-900/20 border border-green-800 hover:bg-green-800/30 text-green-400 text-xs py-1 px-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          SAVE...
        </button>
        <button 
          onClick={() => { onLoad(); if(onClose) onClose(); }}
          disabled={!hasSaveData}
          className="bg-green-900/20 border border-green-800 hover:bg-green-800/30 text-green-400 text-xs py-1 px-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          LOAD...
        </button>
      </div>
      {hasSaveData && (
        <p className="text-[10px] text-green-800 mt-1 text-center">
          DATA FOUND
        </p>
      )}
    </div>
  );

  // Common wrapper styles for both System Offline and Active Game states
  const wrapperClasses = `
    flex flex-col border-l-2 border-green-800 bg-zinc-950/95 h-full shrink-0
    fixed inset-y-0 right-0 z-40 w-80 transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:w-72 md:bg-zinc-950/90
    ${isOpen ? 'translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]' : 'translate-x-full'}
  `;

  const MobileBackdrop = () => (
    isOpen ? (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        onClick={onClose}
      />
    ) : null
  );

  const Header = ({ title }: { title: string }) => (
    <div className="p-4 border-b border-green-900 flex justify-between items-center">
      <h2 className="text-xl font-bold text-green-900 md:text-green-400 mb-1 uppercase tracking-wider">{title}</h2>
      {/* Mobile Close Button */}
      <button 
        onClick={onClose}
        className="md:hidden text-green-600 hover:text-green-400 font-mono text-xl"
      >
        [X]
      </button>
    </div>
  );

  // Helper for labels
  const L = (ja: string, en: string) => language === 'ja' ? ja : en;

  // -- RENDER: System Offline State --
  if (!gameState) {
    return (
      <>
        <MobileBackdrop />
        <div className={wrapperClasses}>
          <Header title="Status" />
          <div className="p-4 text-green-800 text-center mt-10 text-sm uppercase tracking-widest flex-1">
            System Offline
          </div>
          <div className="mt-auto mb-4">
            <SettingsToggle />
            <SystemControls />
          </div>
          <div className="p-4 border-t border-green-900 text-xs text-green-900 text-center">
            Terminal Ready
          </div>
        </div>
      </>
    );
  }

  // -- RENDER: Active Game State --
  return (
    <>
      <MobileBackdrop />
      <div className={`${wrapperClasses} font-mono text-green-500`}>
        <div className="p-4 border-b border-green-900 flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-400 mb-1 uppercase tracking-wider">Status</h2>
          <button 
            onClick={onClose}
            className="md:hidden text-green-600 hover:text-green-400 font-mono text-xl"
          >
            [X]
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Location */}
          <div>
            <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">{L('現在地', 'LOCATION')}</h3>
            <p className="text-lg font-bold text-green-300 leading-tight">{gameState.locationName}</p>
          </div>

          {/* Map Button */}
          <div>
            <button 
              onClick={() => { onOpenMap(); if(onClose) onClose(); }}
              className="w-full bg-green-900/30 border border-green-600 hover:bg-green-800/40 text-green-300 py-1.5 px-2 rounded-sm transition-all flex items-center justify-center space-x-2 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-sm font-bold tracking-widest group-hover:text-green-100">VIEW MAP</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">{L('スコア', 'SCORE')}</h3>
              <p className="text-2xl font-bold text-green-300">{gameState.score}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">{L('ターン', 'MOVES')}</h3>
              <p className="text-2xl font-bold text-green-300">{gameState.moves}</p>
            </div>
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-xs uppercase text-green-700 mb-2 border-b border-green-900/50 pb-1">{L('持ち物 (Inventory)', 'INVENTORY')}</h3>
            {gameState.inventory.length === 0 ? (
              <p className="text-green-800 italic text-sm">{L('なし', 'Empty')}</p>
            ) : (
              <ul className="space-y-2">
                {gameState.inventory.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2 text-green-700">-</span>
                    <span className="text-green-400">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="mt-auto mb-4 border-t border-green-900/30 pt-2">
          <SettingsToggle />
          <SystemControls />
        </div>

        <div className="p-4 border-t border-green-900 text-xs text-green-800 text-center">
           Zork I Simulation
           <br/>
           Powered by Gemini 2.5 Flash
        </div>
      </div>
    </>
  );
};
