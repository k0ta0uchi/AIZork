
import React, { useState, useEffect } from 'react';
import { initializeGame, sendCommand, generateSceneImage, restoreSession } from './services/geminiService';
import { playInputSound, playResponseSound, playImportantSound, playGameOverSound, setMute } from './services/audioService';
import { GameState, ChatMessage, GameStatus, ResponseCategory, Content, SavedGame } from './types';
import { RetroInput, Suggestion } from './components/RetroInput';
import { StatusPanel } from './components/StatusPanel';
import { GameLog } from './components/GameLog';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'model',
  text: "システム初期化中...\nZORK I ゲームエンジン (Japanese Translation Module) をロードしています...\n\n準備ができたら「START」ボタンを押してください。",
  isSystemMessage: true
};

const SAVE_KEY = 'zork_save_v1';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [history, setHistory] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [sessionHistory, setSessionHistory] = useState<Content[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enableImages, setEnableImages] = useState<boolean>(true);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    setHasSaveData(!!saved);
  }, []);

  useEffect(() => {
    setMute(!enableSound);
  }, [enableSound]);

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

  const processGameState = (newState: GameState, rawText: string) => {
    const messageId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: messageId,
      role: 'model',
      text: newState.narrative,
    };

    // Update session history with the model's raw JSON response
    setSessionHistory(prev => [...prev, { role: 'model', parts: [{ text: rawText }] }]);

    // Determine sound to play based on game state
    if (newState.gameOver) {
      playGameOverSound();
    } else if (newState.category === ResponseCategory.IMPORTANT) {
      playImportantSound();
    } else {
      playResponseSound();
    }

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
    playInputSound(); // Feedback for clicking start
    setStatus(GameStatus.LOADING);
    setHistory([{ id: 'connecting', role: 'model', text: "接続中... 物語を生成しています..." }]);
    setSessionHistory([]); // Reset session history
    try {
      const { gameState, rawText } = await initializeGame();
      // Initial session history needs the start command which is done inside initializeGame implicitly, 
      // but to keep track for restoration, we assume the "START_GAME" was the trigger.
      setSessionHistory([{ role: 'user', parts: [{ text: 'START_GAME' }] }]);
      processGameState(gameState, rawText);
    } catch (error) {
      console.error(error);
      setStatus(GameStatus.ERROR);
      setErrorMsg("ゲームの初期化に失敗しました。APIキーを確認してください。");
    }
  };

  const handleCommand = async (text: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    playInputSound();

    // Optimistic update for UI
    const newHistory = [...history, { id: `user-${Date.now()}`, role: 'user', text } as ChatMessage];
    setHistory(newHistory);
    
    // Update session history with user command
    setSessionHistory(prev => [...prev, { role: 'user', parts: [{ text }] }]);

    setStatus(GameStatus.LOADING);

    try {
      const { gameState, rawText } = await sendCommand(text);
      processGameState(gameState, rawText);
    } catch (error) {
      console.error(error);
      setHistory(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'model', text: "通信エラーが発生しました。もう一度試してください。" }
      ]);
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleSave = () => {
    if (!gameState) return;
    playInputSound();
    const saveData: SavedGame = {
      gameState,
      displayHistory: history,
      sessionHistory,
      timestamp: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    setHasSaveData(true);
    alert("ゲームデータを保存しました");
  };

  const handleLoad = async () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    playInputSound();

    try {
      setStatus(GameStatus.LOADING);
      const saveData: SavedGame = JSON.parse(saved);
      
      // Restore variables
      setGameState(saveData.gameState);
      setHistory(saveData.displayHistory);
      setSessionHistory(saveData.sessionHistory);
      
      // Restore Gemini Session
      await restoreSession(saveData.sessionHistory);
      
      setStatus(saveData.gameState.gameOver ? GameStatus.GAME_OVER : GameStatus.PLAYING);
      playImportantSound(); // Sound to indicate load success
    } catch (e) {
      console.error("Load failed", e);
      alert("セーブデータの読み込みに失敗しました");
      setStatus(GameStatus.IDLE);
    }
  };

  // Handle Game Over reset
  const handleReset = () => {
    playInputSound();
    setStatus(GameStatus.IDLE);
    setHistory([INITIAL_MESSAGE]);
    setGameState(null);
    setErrorMsg(null);
    setSessionHistory([]);
  };

  // Convert string suggestions to Suggestion objects
  const getSuggestions = (): Suggestion[] => {
    if (!gameState?.suggestions || gameState.suggestions.length === 0) {
      return [
        { label: '周りを見る', command: '周りを見る', autoSubmit: true },
        { label: '北へ', command: '北へ移動', autoSubmit: true },
        { label: '南へ', command: '南へ移動', autoSubmit: true },
        { label: '持ち物', command: '持ち物', autoSubmit: true },
      ];
    }

    return gameState.suggestions.map(s => {
      // Auto-submit navigation, looking, and status checks
      // "Move North", "Look", "Inventory" -> Safe to auto-submit
      // "Attack Troll", "Open Box" -> Probably safe in this context too, but let's be slightly conservative
      // For a smooth "Builder-like" experience, if the suggestion is complete like "take sword", it should probably just execute.
      // We'll assume most AI suggestions are complete commands.
      const isMovement = /^(北|南|東|西|上|下|北東|北西|南東|南西)(へ移動)?$/.test(s.replace(/\s/g, ''));
      const isBasic = s.includes('見る') || s === '持ち物' || s === 'ステータス' || s.includes('待機');
      
      // We will default to autoSubmit=true for most things to make it click-to-play,
      // unless it looks like a template (which the AI shouldn't generate per instructions)
      return {
        label: s,
        command: s,
        autoSubmit: isMovement || isBasic || true // Make all suggestions auto-submit for snappier gameplay
      };
    });
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
                
                <div className="flex flex-col space-y-4">
                  <button 
                    onClick={handleStart}
                    className="px-8 py-3 bg-green-900 hover:bg-green-700 text-green-100 font-bold rounded border border-green-500 transition-colors font-mono text-xl animate-pulse"
                  >
                    GAME START
                  </button>
                  {hasSaveData && (
                    <button 
                      onClick={handleLoad}
                      className="px-8 py-2 bg-zinc-800 hover:bg-zinc-700 text-green-400 font-bold rounded border border-green-800 transition-colors font-mono text-lg"
                    >
                      LOAD GAME
                    </button>
                  )}
                </div>
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
               suggestions={getSuggestions()}
             />
          )}
        </div>
      </div>

      {/* Sidebar Stats */}
      <StatusPanel 
        gameState={gameState} 
        enableImages={enableImages} 
        onToggleImages={() => setEnableImages(!enableImages)}
        enableSound={enableSound}
        onToggleSound={() => setEnableSound(!enableSound)}
        onSave={handleSave}
        onLoad={handleLoad}
        hasSaveData={hasSaveData}
      />
    </div>
  );
};

export default App;
