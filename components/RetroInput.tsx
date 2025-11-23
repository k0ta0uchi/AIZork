import React, { useState, useRef, useEffect } from 'react';

interface RetroInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export const RetroInput: React.FC<RetroInputProps> = ({ onSend, disabled, autoFocus = true }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full bg-zinc-900 p-2 border-t-2 border-green-800">
      <span className="mr-2 text-green-500 animate-pulse font-bold text-xl">{'>'}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-lg placeholder-green-900/50"
        placeholder={disabled ? "処理中..." : "コマンドを入力 (例: 北へ移動, ポストを開ける)"}
        autoComplete="off"
      />
    </form>
  );
};
