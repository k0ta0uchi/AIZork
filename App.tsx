import React, { useState } from 'react';
import { initializeGame, sendCommand, generateSceneImage } from './services/geminiService';
import { GameState, ChatMessage, GameStatus, ResponseCategory } from './types';
import { RetroInput } from './components/RetroInput';
import { StatusPanel } from './components/StatusPanel';
import { GameLog } from './components/GameLog';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'model',
  text: "システム初期化中...\nZORK I ゲームエンジン (Japanese Translation Module) をロードしています...\n\n準備ができたら「START」ボタンを押してください。",
  isSystemMessage: true
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [history, setHistory] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enableImages, setEnableImages] = useState<boolean>(true);

  const handleImageGeneration = async (messageId: string, prompt: string) => {
    const imageUrl = await generateSceneImage(prompt);
    if (imageUrl) {
      setHistory(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, imageUrl, isImageLoading: false } 
          : msg
      ));
    } else {
      setHistory(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isImageLoading: false } 
          : msg
      ));
    }
  };

  const processGameState = (newState: GameState) => {
    const messageId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: messageId,
      role: 'model',
      text: newState.narrative,
    };

    // Check category AND if image generation is enabled by user
    if (newState.category === ResponseCategory.IMPORTANT && enableImages) {
      newMessage.isImageLoading = true;
      // Trigger async image generation
      handleImageGeneration(messageId, `${newState.locationName}. ${newState.narrative}`);
    }

    setGameState(newState);
    setHistory(prev => [...prev, newMessage]);

    if (newState.gameOver) {
      setStatus(GameStatus.GAME_OVER);
    } else {
      setStatus(GameStatus.PLAYING);
    }
  };
  
  const handleStart = async () => {
    setStatus(GameStatus.LOADING);
    setHistory([{ id: 'connecting', role: 'model', text: "接続中... 物語を生成しています..." }]);
    try {
      const initialState = await initializeGame();
      processGameState(initialState);
    } catch (error) {
      console.error(error);
      setStatus(GameStatus.ERROR);
      setErrorMsg("ゲームの初期化に失敗しました。APIキーを確認してください。");
    }
  };

  const handleCommand = async (text: string) => {
    if (status !== GameStatus.PLAYING) return;

    // Optimistic update
    const newHistory = [...history, { id: `user-${Date.now()}`, role: 'user', text } as ChatMessage];
    setHistory(newHistory);
    setStatus(GameStatus.LOADING);

    try {
      const newState = await sendCommand(text);
      processGameState(newState);
    } catch (error) {
      console.error(error);
      setHistory(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'model', text: "通信エラーが発生しました。もう一度試してください。" }
      ]);
      setStatus(GameStatus.PLAYING);
    }
  };

  // Handle Game Over reset
  const handleReset = () => {
    setStatus(GameStatus.IDLE);
    setHistory([INITIAL_MESSAGE]);
    setGameState(null);
    setErrorMsg(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black selection:bg-green-900 selection:text-white">
      {/* Mobile Header for stats (simplified) */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-zinc-900 border-b border-green-800 z-20 px-4 py-2 flex justify-between items-center text-green-500 text-xs font-mono">
        <span>{gameState?.locationName || "ZORK I"}</span>
        <span>SCR: {gameState?.score || 0} / MVS: {gameState?.moves || 0}</span>
      </div>

      <div className="flex flex-1 flex-col relative w-full h-full pt-8 md:pt-0">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          
          {/* Start Screen Overlay */}
          {status === GameStatus.IDLE && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
              <div className="text-center space-y-8 p-8 border-4 border-green-800 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)] bg-zinc-950 max-w-lg">
                <h1 className="text-6xl md:text-8xl font-bold text-green-500 tracking-tighter drop-shadow-md font-['VT323']">ZORK I</h1>
                <h2 className="text-xl text-green-700 tracking-widest uppercase">The Great Underground Empire</h2>
                <p className="text-green-400 font-mono text-sm md:text-base">
                  AIによってリアルタイムに翻訳・実行される<br/>
                  伝説のテキストアドベンチャー (日本語版)
                </p>
                
                <button 
                  onClick={handleStart}
                  className="px-8 py-3 bg-green-900 hover:bg-green-700 text-green-100 font-bold rounded border border-green-500 transition-colors font-mono text-xl animate-pulse"
                >
                  GAME START
                </button>
              </div>
            </div>
          )}

          {/* Error Screen */}
          {status === GameStatus.ERROR && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
              <div className="text-center p-8 border border-red-800 rounded bg-red-950/20 text-red-500 font-mono">
                <h3 className="text-xl font-bold mb-4">ERROR</h3>
                <p>{errorMsg}</p>
                <button onClick={handleReset} className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-900/50">RETRY</button>
              </div>
            </div>
          )}

          <GameLog history={history} isTyping={status === GameStatus.LOADING} />

          {status === GameStatus.GAME_OVER && (
             <div className="p-4 bg-zinc-900 border-t border-red-900 text-center">
                <p className="text-red-500 font-bold mb-2 text-lg">*** GAME OVER ***</p>
                <button onClick={handleReset} className="px-6 py-2 bg-red-900/30 border border-red-600 text-red-400 hover:bg-red-900/50 font-mono">
                  RESTART
                </button>
             </div>
          )}

          {status !== GameStatus.IDLE && status !== GameStatus.GAME_OVER && status !== GameStatus.ERROR && (
             <RetroInput 
               onSend={handleCommand} 
               disabled={status === GameStatus.LOADING} 
             />
          )}
        </div>
      </div>

      {/* Sidebar Stats */}
      <StatusPanel 
        gameState={gameState} 
        enableImages={enableImages} 
        onToggleImages={() => setEnableImages(!enableImages)} 
      />
    </div>
  );
};

export default App;