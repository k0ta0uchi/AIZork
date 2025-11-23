
import React from 'react';
import { SavedGame } from '../types';

interface SaveLoadModalProps {
  isOpen: boolean;
  mode: 'save' | 'load';
  onClose: () => void;
  onAction: (slotIndex: number) => void;
  slots: (SavedGame | null)[];
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  mode,
  onClose,
  onAction,
  slots
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl border-2 border-green-800 bg-zinc-950 shadow-[0_0_30px_rgba(34,197,94,0.15)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-900 bg-green-900/10">
          <h2 className="text-xl font-bold text-green-400 tracking-wider uppercase font-mono">
            {mode === 'save' ? 'SAVE GAME DATA' : 'LOAD GAME DATA'}
          </h2>
          <button 
            onClick={onClose}
            className="text-green-600 hover:text-green-300 font-mono text-xl"
          >
            [X]
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto font-mono">
          {slots.map((slot, index) => (
            <div 
              key={index}
              className={`
                relative group border border-green-900/50 p-4 transition-all duration-200
                ${mode === 'save' 
                  ? 'hover:bg-green-900/20 hover:border-green-500 cursor-pointer' 
                  : slot ? 'hover:bg-green-900/20 hover:border-green-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
              `}
              onClick={() => {
                if (mode === 'save' || slot) {
                  onAction(index);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-green-700 font-bold mb-1">SLOT {index + 1}</span>
                  {slot ? (
                    <>
                      <span className="text-green-300 text-lg font-bold truncate">{slot.gameState.locationName}</span>
                      <div className="flex gap-4 text-sm text-green-600 mt-1">
                        <span>{formatDate(slot.timestamp)}</span>
                        <span>SCORE: {slot.gameState.score}</span>
                        <span>MOVES: {slot.gameState.moves}</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-green-800 italic text-lg">NO DATA</span>
                  )}
                </div>
                
                {/* Action Indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="inline-block px-3 py-1 bg-green-800 text-green-100 text-xs font-bold rounded">
                    {mode === 'save' ? 'OVERWRITE' : 'LOAD'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-900 text-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-green-800 text-green-500 hover:bg-green-900/30 hover:text-green-300 transition-colors font-mono text-sm uppercase"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
