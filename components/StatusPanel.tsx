
import React from 'react';
import { GameState } from '../types';

interface StatusPanelProps {
  gameState: GameState | null;
  enableImages: boolean;
  onToggleImages: () => void;
  enableSound: boolean;
  onToggleSound: () => void;
  onSave: () => void;
  onLoad: () => void;
  hasSaveData: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ 
  gameState, 
  enableImages, 
  onToggleImages,
  enableSound,
  onToggleSound,
  onSave,
  onLoad,
  hasSaveData
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
      <div className="flex items-center justify-between group cursor-pointer" onClick={onToggleSound}>
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
    </div>
  );

  const SystemControls = () => (
    <div className="px-4 py-2 mt-2">
      <h3 className="text-xs uppercase text-green-700 mb-2 border-b border-green-900/50 pb-1">System</h3>
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={onSave}
          disabled={!gameState}
          className="bg-green-900/20 border border-green-800 hover:bg-green-800/30 text-green-400 text-xs py-1 px-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          SAVE
        </button>
        <button 
          onClick={onLoad}
          disabled={!hasSaveData}
          className="bg-green-900/20 border border-green-800 hover:bg-green-800/30 text-green-400 text-xs py-1 px-2 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          LOAD
        </button>
      </div>
      {hasSaveData && (
        <p className="text-[10px] text-green-800 mt-1 text-center">
          DATA FOUND
        </p>
      )}
    </div>
  );

  if (!gameState) {
    return (
      <div className="hidden md:flex flex-col w-72 border-l-2 border-green-800 bg-zinc-950/90 h-full shrink-0">
        <div className="p-4 border-b border-green-900">
          <h2 className="text-xl font-bold text-green-900 mb-1 text-center uppercase tracking-wider">Status</h2>
        </div>
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
    );
  }

  return (
    <div className="hidden md:flex w-72 border-l-2 border-green-800 bg-zinc-950/90 h-full flex-col font-mono text-green-500 shrink-0">
      <div className="p-4 border-b border-green-900">
        <h2 className="text-xl font-bold text-green-400 mb-1 text-center uppercase tracking-wider">Status</h2>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
        {/* Location */}
        <div>
          <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">現在地</h3>
          <p className="text-lg font-bold text-green-300 leading-tight">{gameState.locationName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">スコア</h3>
            <p className="text-2xl font-bold text-green-300">{gameState.score}</p>
          </div>
          <div>
            <h3 className="text-xs uppercase text-green-700 mb-1 border-b border-green-900/50 pb-1">ターン</h3>
            <p className="text-2xl font-bold text-green-300">{gameState.moves}</p>
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h3 className="text-xs uppercase text-green-700 mb-2 border-b border-green-900/50 pb-1">持ち物 (Inventory)</h3>
          {gameState.inventory.length === 0 ? (
            <p className="text-green-800 italic text-sm">なし</p>
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
  );
};
