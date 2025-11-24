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
    <div className="flex-1 overflow-y-auto p-4 md:p-8 font-mono text-lg leading-relaxed space-y-8 scroll-smooth">
      {history.map((msg, idx) => (
        <div key={msg.id || idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          
          {msg.role === 'user' ? (
            // User Message Style
            <div className="max-w-[85%] md:max-w-[70%]">
              <div className="bg-green-900/20 border border-green-700/50 text-green-300 px-4 py-2 rounded-sm relative shadow-[0_0_10px_rgba(20,83,45,0.2)]">
                <span className="absolute -top-3 right-2 text-[10px] text-green-600 bg-black px-1">COMMAND</span>
                <span className="font-bold mr-2 text-green-500">{'>'}</span>
                {msg.text}
              </div>
            </div>
          ) : (
            // AI Message Style
            <div className="w-full max-w-4xl animate-fadeIn">
              {msg.isSystemMessage ? (
                <div className="border-l-4 border-green-800 pl-4 py-2 text-green-600 text-sm font-mono whitespace-pre-wrap mb-4">
                  {msg.text}
                </div>
              ) : (
                <div className="prose prose-invert prose-p:text-green-400 prose-p:leading-relaxed prose-strong:text-green-200 prose-strong:font-bold max-w-none">
                  {/* Decorative Header for AI Response */}
                  <div className="flex items-center gap-2 mb-2 opacity-30">
                     <span className="h-px w-4 bg-green-500"></span>
                     <span className="text-[10px] uppercase tracking-widest text-green-500">Log Entry {idx}</span>
                  </div>
                  
                  <div 
                    className="retro-glow"
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} 
                  />
                </div>
              )}
              
              {/* Image Display Area */}
              {(msg.imageUrl || msg.isImageLoading) && (
                <div className="mt-6 ml-0 md:ml-4 max-w-md relative group">
                  {/* Technical Frame */}
                  <div className="absolute -inset-1 border border-green-900/40 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-600"></div>
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-green-600"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-green-600"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-600"></div>

                  <div className="bg-black border border-green-900 overflow-hidden relative">
                    {msg.imageUrl ? (
                       <>
                         <img 
                           src={msg.imageUrl} 
                           alt="Generated Scene" 
                           className="w-full h-auto filter sepia-[.5] hue-rotate-[50deg] contrast-[1.1] opacity-90 transition-opacity duration-1000"
                         />
                         {/* Scanline overlay specific to image */}
                         <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px] opacity-40"></div>
                         <div className="absolute bottom-1 right-2 text-[8px] text-green-900 bg-black/50 px-1">IMG_GEN_V2.5</div>
                       </>
                    ) : (
                      <div className="h-56 w-full flex flex-col items-center justify-center text-green-800 bg-zinc-950">
                         <div className="w-8 h-8 border-2 border-green-800 border-t-green-400 rounded-full animate-spin mb-4"></div>
                         <div className="text-sm tracking-widest animate-pulse">RENDERING VISUALS</div>
                         <div className="text-[10px] mt-1 text-green-900">PROCESSING DATA STREAM...</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {isTyping && (
        <div className="flex items-center space-x-2 text-green-700 ml-2">
           <span className="w-2 h-2 bg-green-600 animate-bounce"></span>
           <span className="w-2 h-2 bg-green-600 animate-bounce delay-100"></span>
           <span className="w-2 h-2 bg-green-600 animate-bounce delay-200"></span>
        </div>
      )}
      
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};