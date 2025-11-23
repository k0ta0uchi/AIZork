import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface GameLogProps {
  history: ChatMessage[];
  isTyping: boolean;
}

export const GameLog: React.FC<GameLogProps> = ({ history, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 font-mono text-lg leading-relaxed space-y-6">
      {history.map((msg, idx) => (
        <div key={msg.id || idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
          {msg.role === 'user' ? (
            <div className="inline-block bg-green-900/20 border border-green-800/50 rounded px-4 py-2 text-green-300">
              <span className="mr-2 text-xs text-green-600 uppercase font-bold">CMD &gt;</span>
              {msg.text}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-invert prose-p:text-green-400 prose-strong:text-green-300 max-w-none">
                <div dangerouslySetInnerHTML={{ 
                    __html: msg.text.replace(/\n/g, '<br/>') 
                }} />
              </div>
              
              {/* Image Display Area */}
              {(msg.imageUrl || msg.isImageLoading) && (
                <div className="mt-4 max-w-md border-4 border-green-900/50 rounded-sm overflow-hidden bg-black/50 relative">
                  {msg.imageUrl ? (
                     <img 
                       src={msg.imageUrl} 
                       alt="Generated Scene" 
                       className="w-full h-auto filter sepia-[.8] hue-rotate-[50deg] contrast-[1.2] opacity-90"
                     />
                  ) : (
                    <div className="h-48 w-full flex flex-col items-center justify-center text-green-800 animate-pulse">
                       <div className="text-2xl mb-2">LOADING VISUALS...</div>
                       <div className="text-xs font-mono">PROCESSING NANO BANANA GRAPHICS</div>
                    </div>
                  )}
                  {/* Scanline overlay for image */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-30"></div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="text-left">
           <span className="inline-block w-2 h-4 bg-green-500 animate-blink ml-1 align-middle"></span>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};
