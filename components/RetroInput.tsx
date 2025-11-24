
import React, { useState, useRef, useEffect } from 'react';
import { FontSize } from '../types';

export interface Suggestion {
  label: string;
  command: string;
  autoSubmit: boolean;
}

interface RetroInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
  suggestions?: Suggestion[];
  placeholder?: string;
  fontSize: FontSize;
}

export const RetroInput: React.FC<RetroInputProps> = ({ 
  onSend, 
  disabled, 
  autoFocus = true,
  suggestions = [],
  placeholder = "コマンドを入力...",
  fontSize
}) => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, autoFocus, input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setCommandHistory(prev => [...prev, input]);
      setHistoryIndex(-1);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.autoSubmit) {
      onSend(suggestion.command);
      setCommandHistory(prev => [...prev, suggestion.command]);
      setHistoryIndex(-1);
      setInput('');
    } else {
      setInput(suggestion.command + ' ');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getTextSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-base';
      case 'large': return 'text-xl';
      case 'medium':
      default: return 'text-lg';
    }
  };

  return (
    <div className="w-full bg-zinc-950 border-t-2 border-green-900/60 p-2 shadow-[0_-5px_15px_rgba(0,0,0,0.5)] z-30">
      
      {/* Suggestions Bar */}
      {!disabled && suggestions.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-2 mb-2 no-scrollbar px-1">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="whitespace-nowrap px-3 py-1 bg-green-900/10 border border-green-800 text-green-500 text-xs hover:bg-green-800 hover:text-green-100 transition-all font-mono flex-shrink-0 uppercase tracking-wider"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Field */}
      <div className="relative flex items-center bg-black border border-green-800/50 p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        <span className={`text-green-500 font-bold mr-3 animate-pulse ${getTextSizeClass()}`}>{'>'}</span>
        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`w-full bg-transparent border-none outline-none text-green-400 font-mono placeholder-green-900 caret-green-500 ${getTextSizeClass()}`}
            placeholder={disabled ? "PROCESSING..." : placeholder}
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
};
