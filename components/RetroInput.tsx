
import React, { useState, useRef, useEffect } from 'react';

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
}

export const RetroInput: React.FC<RetroInputProps> = ({ 
  onSend, 
  disabled, 
  autoFocus = true,
  suggestions = [],
  placeholder = "コマンドを入力..."
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, autoFocus, input]); // input dependency ensures focus comes back after typing

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.autoSubmit) {
      onSend(suggestion.command);
      setInput('');
    } else {
      setInput(suggestion.command + ' ');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="w-full bg-zinc-900 border-t-2 border-green-800">
      {/* Suggestions Area */}
      {!disabled && suggestions.length > 0 && (
        <div className="flex overflow-x-auto py-2 px-2 gap-2 no-scrollbar border-b border-green-900/30">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="whitespace-nowrap px-3 py-1 bg-green-900/20 border border-green-700/50 text-green-400 text-xs rounded hover:bg-green-800/50 hover:text-green-200 transition-colors font-mono flex-shrink-0"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center w-full p-2">
        <span className="mr-2 text-green-500 animate-pulse font-bold text-xl">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-lg placeholder-green-900/50"
          placeholder={disabled ? "..." : placeholder}
          autoComplete="off"
        />
      </form>
    </div>
  );
};
