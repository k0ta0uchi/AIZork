
import React, { useState, useEffect } from 'react';
import { initializeGame, sendCommand, generateSceneImage, restoreSession, switchSessionLanguage } from './services/geminiService';
import { playInputSound, playResponseSound, playImportantSound, playGameOverSound, setMute } from './services/audioService';
import { GameState, ChatMessage, GameStatus, ResponseCategory, Content, SavedGame, Language } from './types';
import { RetroInput, Suggestion } from './components/RetroInput';
import { StatusPanel } from './components/StatusPanel';
import { GameLog } from './components/GameLog';

const SAVE_KEY = 'zork_save_v1';

// UI Text Dictionary
const UI_TEXT = {
  ja: {
    systemInit: "システム初期化中...\nZORK I ゲームエンジン (Japanese Translation Module) をロードしています...\n\n準備ができたら「START」ボタンを押してください。",
    connecting: "接続中... 物語を生成しています...",
    connectError: "ゲームの初期化に失敗しました。APIキーを確認してください。",
    commError: "通信エラーが発生しました。もう一度試してください。",
    saveSuccess: "ゲームデータを保存しました",
    saveFail: "セーブに失敗しました。データ容量が上限を超えています。",
    loadFail: "セーブデータの読み込みに失敗しました",
    titleSub: "AIによってリアルタイムに翻訳・実行される\n伝説のテキストアドベンチャー (日本語版)",
    startButton: "GAME START",
    loadButton: "LOAD GAME",
    errorTitle: "ERROR",
    retryButton: "RETRY",
    gameOver: "*** GAME OVER ***",
    restartButton: "RESTART",
    placeholder: "コマンドを入力...",
    defaultSuggestions: [
      { label: '周りを見る', command: '周りを見る' },
      { label: '北へ', command: '北へ移動' },
      { label: '南へ', command: '南へ移動' },
      { label: '持ち物', command: '持ち物' },
    ]
  },
  en: {
    systemInit: "System Initializing...\nLoading ZORK I Game Engine...\n\nPress 'START' when ready.",
    connecting: "Connecting... Generating story...",
    connectError: "Failed to initialize game. Please check your API Key.",
    commError: "Communication error. Please try again.",
    saveSuccess: "Game saved successfully.",
    saveFail: "Save failed. Storage limit exceeded.",
    loadFail: "Failed to load save data.",
    titleSub: "The legendary text adventure, simulated by AI\nin real-time.",
    startButton: "GAME START",
    loadButton: "LOAD GAME",
    errorTitle: "ERROR",
    retryButton: "RETRY",
    gameOver: "*** GAME OVER ***",
    restartButton: "RESTART",
    placeholder: "Enter command...",
    defaultSuggestions: [
      { label: 'Look', command: 'Look' },
      { label: 'North', command: 'North' },
      { label: 'South', command: 'South' },
      { label: 'Inventory', command: 'Inventory' },
    ]
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ja');
  const T = UI_TEXT[language];

  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Content[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enableImages, setEnableImages] = useState<boolean>(true);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);

  // Initialize history with correct language on mount or lang change if idle
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      setHistory([{
        id: 'init',
        role: 'model',
        text: UI_TEXT[language].systemInit,
        isSystemMessage: true
      }]);
    }
  }, [language, status]);

  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    setHasSaveData(!!saved);
  }, []);

  useEffect(() => {
    setMute(!enableSound);
  }, [enableSound]);

  const handleToggleLanguage = async () => {
    const newLang = language === 'ja' ? 'en' : 'ja';
    setLanguage(newLang);
    
    // If playing, notify the AI to switch languages dynamically
    if (status === GameStatus.PLAYING) {
       setStatus(GameStatus.LOADING);
       try {
         const { gameState: newState, rawText } = await switchSessionLanguage(newLang);
         processGameState(newState, rawText);
       } catch (e) {
         console.error("Language switch failed", e);
         setStatus(GameStatus.PLAYING);
       }
    }
  };

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

    setSessionHistory(prev => [...prev, { role: 'model', parts: [{ text: rawText }] }]);

    if (newState.gameOver) {
      playGameOverSound();
    } else if (newState.category === ResponseCategory.IMPORTANT) {
      playImportantSound();
    } else {
      playResponseSound();
    }

    if (newState.category === ResponseCategory.IMPORTANT && enableImages) {
      newMessage.isImageLoading = true;
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
    playInputSound();
    setStatus(GameStatus.LOADING);
    setHistory([{ id: 'connecting', role: 'model', text: T.connecting }]);
    setSessionHistory([]); 
    try {
      const { gameState, rawText } = await initializeGame(language);
      setSessionHistory([{ role: 'user', parts: [{ text: 'START_GAME' }] }]);
      processGameState(gameState, rawText);
    } catch (error) {
      console.error(error);
      setStatus(GameStatus.ERROR);
      setErrorMsg(T.connectError);
    }
  };

  const handleCommand = async (text: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    playInputSound();

    const newHistory = [...history, { id: `user-${Date.now()}`, role: 'user', text } as ChatMessage];
    setHistory(newHistory);
    
    setSessionHistory(prev => [...prev, { role: 'user', parts: [{ text }] }]);

    setStatus(GameStatus.LOADING);

    try {
      const { gameState, rawText } = await sendCommand(text);
      processGameState(gameState, rawText);
    } catch (error) {
      console.error(error);
      setHistory(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'model', text: T.commError }
      ]);
      setStatus(GameStatus.PLAYING);
    }
  };

  const handleSave = () => {
    if (!gameState) return;
    playInputSound();
    
    const sanitizedHistory = history.map(msg => ({
      ...msg,
      imageUrl: undefined,
      isImageLoading: false
    }));

    const saveData: SavedGame = {
      gameState,
      displayHistory: sanitizedHistory,
      sessionHistory,
      timestamp: Date.now(),
      language
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      setHasSaveData(true);
      alert(T.saveSuccess);
    } catch (e) {
      console.error("Save failed", e);
      alert(T.saveFail);
    }
  };

  const handleLoad = async () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    playInputSound();

    try {
      setStatus(GameStatus.LOADING);
      const saveData: SavedGame = JSON.parse(saved);
      
      setGameState(saveData.gameState);
      setHistory(saveData.displayHistory);
      setSessionHistory(saveData.sessionHistory);
      if (saveData.language) {
        setLanguage(saveData.language);
      }
      
      await restoreSession(saveData.sessionHistory, saveData.language || 'ja');
      
      setStatus(saveData.gameState.gameOver ? GameStatus.GAME_OVER : GameStatus.PLAYING);
      playImportantSound();
    } catch (e) {
      console.error("Load failed", e);
      alert(T.loadFail);
      setStatus(GameStatus.IDLE);
    }
  };

  const handleReset = () => {
    playInputSound();
    setStatus(GameStatus.IDLE);
    // History will be reset by useEffect depending on current language
    setGameState(null);
    setErrorMsg(null);
    setSessionHistory([]);
  };

  const getSuggestions = (): Suggestion[] => {
    // If we have AI suggestions, filter/map them
    if (gameState?.suggestions && gameState.suggestions.length > 0) {
      return gameState.suggestions.map(s => {
        const isMovement = /^(North|South|East|West|Up|Down|NE|NW|SE|SW|北|南|東|西|上|下|北東|北西|南東|南西)(へ移動)?$/i.test(s.replace(/\s/g, ''));
        // Basic check for non-action verbs to auto-submit
        const isBasic = /^(Look|Inventory|Status|Wait|周りを見る|持ち物|ステータス|待機)/i.test(s);
        
        return {
          label: s,
          command: s,
          autoSubmit: isMovement || isBasic || true 
        };
      });
    }

    // Fallback default suggestions
    return T.defaultSuggestions.map(s => ({ ...s, autoSubmit: true }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black selection:bg-green-900 selection:text-white">
      {/* Mobile Header */}
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
                <p className="text-green-400 font-mono text-sm md:text-base whitespace-pre-wrap">
                  {T.titleSub}
                </p>
                
                <div className="flex flex-col space-y-4">
                  <button 
                    onClick={handleStart}
                    className="px-8 py-3 bg-green-900 hover:bg-green-700 text-green-100 font-bold rounded border border-green-500 transition-colors font-mono text-xl animate-pulse"
                  >
                    {T.startButton}
                  </button>
                  {hasSaveData && (
                    <button 
                      onClick={handleLoad}
                      className="px-8 py-2 bg-zinc-800 hover:bg-zinc-700 text-green-400 font-bold rounded border border-green-800 transition-colors font-mono text-lg"
                    >
                      {T.loadButton}
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
                <h3 className="text-xl font-bold mb-4">{T.errorTitle}</h3>
                <p>{errorMsg}</p>
                <button onClick={handleReset} className="mt-4 px-4 py-2 border border-red-500 hover:bg-red-900/50">{T.retryButton}</button>
              </div>
            </div>
          )}

          <GameLog history={history} isTyping={status === GameStatus.LOADING} />

          {status === GameStatus.GAME_OVER && (
             <div className="p-4 bg-zinc-900 border-t border-red-900 text-center">
                <p className="text-red-500 font-bold mb-2 text-lg">{T.gameOver}</p>
                <button onClick={handleReset} className="px-6 py-2 bg-red-900/30 border border-red-600 text-red-400 hover:bg-red-900/50 font-mono">
                  {T.restartButton}
                </button>
             </div>
          )}

          {status !== GameStatus.IDLE && status !== GameStatus.GAME_OVER && status !== GameStatus.ERROR && (
             <RetroInput 
               onSend={handleCommand} 
               disabled={status === GameStatus.LOADING}
               suggestions={getSuggestions()}
               placeholder={T.placeholder}
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
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onSave={handleSave}
        onLoad={handleLoad}
        hasSaveData={hasSaveData}
      />
    </div>
  );
};

export default App;
