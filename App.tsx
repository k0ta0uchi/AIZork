
import React, { useState, useEffect } from 'react';
import { initializeGame, sendCommand, generateSceneImage, restoreSession, switchSessionLanguage } from './services/geminiService';
import { playInputSound, playResponseSound, playImportantSound, playGameOverSound, setMute, playBGM, stopBGM, setBgmMute } from './services/audioService';
import { GameState, ChatMessage, GameStatus, ResponseCategory, Content, SavedGame, Language, BGMMood, GameVersion, Coordinates, FontSize } from './types';
import { RetroInput, Suggestion } from './components/RetroInput';
import { StatusPanel } from './components/StatusPanel';
import { GameLog } from './components/GameLog';
import { SaveLoadModal } from './components/SaveLoadModal';
import { MapModal } from './components/MapModal';

const SAVE_KEY_PREFIX = 'zork_save_slot_';
const MAX_SLOTS = 5;

// UI Text Dictionary
const UI_TEXT = {
  ja: {
    systemInit: "システム初期化中...\nZORK I/II/III ゲームエンジン (Japanese Translation Module) をロードしています...\n\nゲームを選択してください。",
    connecting: "接続中... 物語を生成しています...",
    connectError: "ゲームの初期化に失敗しました。APIキーを確認してください。",
    commError: "通信エラーが発生しました。もう一度試してください。",
    saveSuccess: "ゲームデータをスロットに保存しました",
    saveFail: "セーブに失敗しました。データ容量が上限を超えています。",
    loadFail: "セーブデータの読み込みに失敗しました",
    loadVersionMismatch: "異なるゲームバージョンのセーブデータです。ロードできません。",
    titleSub: "AIによってリアルタイムに翻訳・実行される\n伝説のテキストアドベンチャー (日本語版)",
    startButton: "GAME START",
    loadButton: "LOAD GAME",
    errorTitle: "ERROR",
    retryButton: "RETRY",
    gameOver: "*** GAME OVER ***",
    restartButton: "RESTART",
    placeholder: "コマンドを入力...",
    hintPrefix: "例: ",
    defaultSuggestions: [
      { label: '周りを見る', command: '周りを見る' },
      { label: '北へ', command: '北へ移動' },
      { label: '南へ', command: '南へ移動' },
      { label: '持ち物', command: '持ち物' },
    ]
  },
  en: {
    systemInit: "System Initializing...\nLoading ZORK I/II/III Game Engine...\n\nSelect a game to start.",
    connecting: "Connecting... Generating story...",
    connectError: "Failed to initialize game. Please check your API Key.",
    commError: "Communication error. Please try again.",
    saveSuccess: "Game saved to slot.",
    saveFail: "Save failed. Storage limit exceeded.",
    loadFail: "Failed to load save data.",
    loadVersionMismatch: "Save data is for a different game version.",
    titleSub: "The legendary text adventure, simulated by AI\nin real-time.",
    startButton: "GAME START",
    loadButton: "LOAD GAME",
    errorTitle: "ERROR",
    retryButton: "RETRY",
    gameOver: "*** GAME OVER ***",
    restartButton: "RESTART",
    placeholder: "Enter command...",
    hintPrefix: "Try: ",
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
  const [selectedGame, setSelectedGame] = useState<GameVersion>(GameVersion.ZORK1);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Content[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Settings States
  const [enableImages, setEnableImages] = useState<boolean>(true);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [enableMusic, setEnableMusic] = useState<boolean>(true);
  const [enableCRT, setEnableCRT] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  
  const [hasSaveData, setHasSaveData] = useState<boolean>(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [saveSlots, setSaveSlots] = useState<(SavedGame | null)[]>([]);

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

  // Check for any save data on mount
  useEffect(() => {
    checkSaveData();
  }, []);

  useEffect(() => {
    setMute(!enableSound);
  }, [enableSound]);

  useEffect(() => {
    setBgmMute(!enableMusic);
  }, [enableMusic]);

  // Handle BGM changes based on game state
  useEffect(() => {
    if (status === GameStatus.IDLE) {
       // Play Title Screen BGM
       playBGM(BGMMood.TITLE, GameVersion.ZORK1); // Use Zork1 as default container for Title theme
       return;
    }

    if (status === GameStatus.GAME_OVER) {
       playGameOverSound();
       stopBGM();
       return;
    }

    if (gameState?.bgmMood) {
      playBGM(gameState.bgmMood, selectedGame);
    } else {
      stopBGM();
    }
  }, [gameState?.bgmMood, status, selectedGame]);

  const checkSaveData = () => {
    let found = false;
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`)) {
        found = true;
        break;
      }
    }
    setHasSaveData(found);
  };

  const loadSlotsData = () => {
    const slots: (SavedGame | null)[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const data = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`);
      slots.push(data ? JSON.parse(data) : null);
    }
    setSaveSlots(slots);
  };

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

  // Process and update game state, including auto-mapping
  const processGameState = (aiState: GameState, rawText: string) => {
    const messageId = Date.now().toString();
    
    // --- Auto-Mapping Logic ---
    const currentCoords = aiState.coordinates;
    const previousVisited = gameState?.visitedLocations || [];
    
    const isVisited = previousVisited.some(
      v => v.x === currentCoords.x && v.y === currentCoords.y && v.floor === currentCoords.floor
    );

    const updatedVisited = isVisited 
      ? previousVisited 
      : [...previousVisited, currentCoords];

    const finalState: GameState = {
      ...aiState,
      visitedLocations: updatedVisited
    };

    const newMessage: ChatMessage = {
      id: messageId,
      role: 'model',
      text: finalState.narrative,
    };

    setSessionHistory(prev => [...prev, { role: 'model', parts: [{ text: rawText }] }]);

    if (finalState.gameOver) {
      // BGM handled in effect
    } else if (finalState.category === ResponseCategory.IMPORTANT) {
      playImportantSound();
    } else {
      playResponseSound();
    }

    if (finalState.category === ResponseCategory.IMPORTANT && enableImages) {
      newMessage.isImageLoading = true;
      handleImageGeneration(messageId, `${finalState.locationName}. ${finalState.narrative}`);
    }

    setGameState(finalState);
    setHistory(prev => [...prev, newMessage]);

    if (finalState.gameOver) {
      setStatus(GameStatus.GAME_OVER);
    } else {
      setStatus(GameStatus.PLAYING);
    }
  };
  
  const handleStart = async (version: GameVersion) => {
    playInputSound();
    setSelectedGame(version);
    setStatus(GameStatus.LOADING);
    setHistory([{ id: 'connecting', role: 'model', text: T.connecting }]);
    setSessionHistory([]);
    setGameState(null);

    try {
      const { gameState: initialAiState, rawText } = await initializeGame(language, version);
      setSessionHistory([{ role: 'user', parts: [{ text: 'START_GAME' }] }]);
      processGameState(initialAiState, rawText);
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
      const { gameState: nextAiState, rawText } = await sendCommand(text);
      processGameState(nextAiState, rawText);
    } catch (error) {
      console.error(error);
      setHistory(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'model', text: T.commError }
      ]);
      setStatus(GameStatus.PLAYING);
    }
  };

  const openSaveModal = () => {
    playInputSound();
    loadSlotsData();
    setIsSaveModalOpen(true);
  };

  const openLoadModal = () => {
    playInputSound();
    loadSlotsData();
    setIsLoadModalOpen(true);
  };

  const executeSave = (slotIndex: number) => {
    if (!gameState) return;
    
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
      language,
      gameVersion: selectedGame
    };

    try {
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slotIndex}`, JSON.stringify(saveData));
      checkSaveData();
      setIsSaveModalOpen(false);
      alert(T.saveSuccess);
    } catch (e) {
      console.error("Save failed", e);
      alert(T.saveFail);
    }
  };

  const executeLoad = async (slotIndex: number) => {
    const saved = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotIndex}`);
    if (!saved) return;
    
    try {
      const saveData: SavedGame = JSON.parse(saved);
      setSelectedGame(saveData.gameVersion || GameVersion.ZORK1);

      setIsLoadModalOpen(false);
      setStatus(GameStatus.LOADING);
      
      setGameState(saveData.gameState);
      setHistory(saveData.displayHistory);
      setSessionHistory(saveData.sessionHistory);
      if (saveData.language) {
        setLanguage(saveData.language);
      }
      
      await restoreSession(saveData.sessionHistory, saveData.language || 'ja', saveData.gameVersion || GameVersion.ZORK1);
      
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
    stopBGM();
    setStatus(GameStatus.IDLE);
    setGameState(null);
    setErrorMsg(null);
    setSessionHistory([]);
  };

  const getSuggestions = (): Suggestion[] => {
    if (gameState?.suggestions && gameState.suggestions.length > 0) {
      return gameState.suggestions.map(s => {
        const isMovement = /^(North|South|East|West|Up|Down|NE|NW|SE|SW|北|南|東|西|上|下|北東|北西|南東|南西)(へ移動)?$/i.test(s.replace(/\s/g, ''));
        const isBasic = /^(Look|Inventory|Status|Wait|周りを見る|持ち物|ステータス|待機)/i.test(s);
        
        return {
          label: s,
          command: s,
          autoSubmit: isMovement || isBasic || true 
        };
      });
    }
    return T.defaultSuggestions.map(s => ({ ...s, autoSubmit: true }));
  };

  const getDynamicPlaceholder = () => {
    if (status !== GameStatus.PLAYING && status !== GameStatus.GAME_OVER) return T.placeholder;
    if (gameState?.suggestions && gameState.suggestions.length > 0) {
      return `${T.hintPrefix}${gameState.suggestions[0]} ...`;
    }
    return T.placeholder;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black selection:bg-green-900 selection:text-white relative">
      {/* CRT Effects */}
      {enableCRT && (
        <>
          <div className="bg-noise"></div>
          <div className="scanlines"></div>
          <div className="crt-vignette"></div>
        </>
      )}

      {/* Background Grid for the Monitor Feel */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-black/90 border-b-2 border-green-900 z-30 px-4 py-2 flex justify-between items-center text-green-500 text-xs font-mono shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <span className="truncate max-w-[50%] font-bold tracking-widest">{gameState?.locationName || 'TERMINAL ACTIVE'}</span>
        <div className="flex items-center space-x-3">
          <span className="text-green-700">|</span>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center space-x-1 text-green-400 border border-green-800 rounded px-2 py-1 bg-green-950/50"
          >
            <span>SYS</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Layout Container - Centered for wide screens */}
      <div className="flex flex-1 flex-col relative w-full h-full pt-12 md:pt-0 z-10 p-2 md:p-6 md:pr-0 items-center">
        
        {/* Max Width Limiter for Ultra-Wide Screens */}
        <div className="w-full max-w-5xl h-full flex flex-col">
          
          {/* Main Monitor Container */}
          <div className={`flex-1 flex flex-col min-h-0 relative border-2 border-green-900/60 bg-black/80 rounded-sm shadow-[0_0_15px_rgba(20,83,45,0.3)_inset] overflow-hidden ${enableCRT ? 'retro-border' : ''}`}>
            
            {/* Start Screen Overlay */}
            {status === GameStatus.IDLE && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-30 overflow-y-auto">
                 {/* Grid Background in Modal */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #15803d 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <div className="relative text-center w-full max-w-4xl p-4">
                  <div className="mb-12 border-b-2 border-green-800 pb-8">
                    <h1 className={`text-8xl md:text-9xl font-bold text-green-500 tracking-tighter font-['VT323'] filter drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] ${enableCRT ? 'animate-crt' : ''}`}>ZORK</h1>
                    <h2 className="text-2xl text-green-700 tracking-[0.5em] uppercase mt-2">Interactive Fiction Saga</h2>
                  </div>
                  
                  <p className="text-green-400 font-mono text-base mb-10 opacity-80 max-w-xl mx-auto border-l-2 border-green-900 pl-4 text-left">
                    {T.titleSub}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
                    {/* Zork I */}
                    <button 
                      onClick={() => handleStart(GameVersion.ZORK1)}
                      className="group relative h-40 border-2 border-green-900 bg-green-950/20 hover:bg-green-900/30 hover:border-green-500 transition-all duration-300 flex flex-col items-center justify-center p-4 overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse"></div>
                      <span className="text-4xl font-bold text-green-300 mb-2 group-hover:text-green-100 group-hover:scale-110 transition-transform">I</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-green-500">The Great<br/>Underground Empire</span>
                    </button>

                    {/* Zork II */}
                    <button 
                      onClick={() => handleStart(GameVersion.ZORK2)}
                      className="group relative h-40 border-2 border-green-900 bg-green-950/20 hover:bg-green-900/30 hover:border-green-500 transition-all duration-300 flex flex-col items-center justify-center p-4 overflow-hidden"
                    >
                       <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse"></div>
                      <span className="text-4xl font-bold text-green-300 mb-2 group-hover:text-green-100 group-hover:scale-110 transition-transform">II</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-green-500">The Wizard<br/>of Frobozz</span>
                    </button>

                    {/* Zork III */}
                    <button 
                      onClick={() => handleStart(GameVersion.ZORK3)}
                      className="group relative h-40 border-2 border-green-900 bg-green-950/20 hover:bg-green-900/30 hover:border-green-500 transition-all duration-300 flex flex-col items-center justify-center p-4 overflow-hidden"
                    >
                       <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-pulse"></div>
                      <span className="text-4xl font-bold text-green-300 mb-2 group-hover:text-green-100 group-hover:scale-110 transition-transform">III</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-green-500">The Dungeon<br/>Master</span>
                    </button>
                  </div>

                  <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center items-center">
                    {/* Remix Button */}
                     <button 
                      onClick={() => handleStart(GameVersion.ZORK_REMIX)}
                      className="w-full md:w-auto px-8 py-3 border border-purple-900 bg-purple-950/10 hover:bg-purple-900/30 hover:border-purple-500 text-purple-400 hover:text-purple-200 font-bold transition-all uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(147,51,234,0.1)] relative overflow-hidden group"
                    >
                      <span className="relative z-10">Zork Remix</span>
                      <div className="absolute inset-0 bg-purple-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </button>

                    {hasSaveData && (
                       <button 
                        onClick={openLoadModal}
                        className="w-full md:w-auto px-8 py-3 border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-green-400/80 font-bold transition-all uppercase tracking-widest"
                      >
                        {T.loadButton}
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-16 text-xs text-green-900 font-mono tracking-widest">
                    COPYRIGHT (C) 2025 AI INTERACTIVE FICTION SYSTEMS
                  </div>
                </div>
              </div>
            )}

            {/* Error Screen */}
            {status === GameStatus.ERROR && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
                <div className="text-center p-8 border-2 border-red-800 bg-black shadow-[0_0_50px_rgba(220,38,38,0.3)] max-w-lg">
                  <h3 className="text-3xl font-bold mb-6 text-red-500 tracking-widest border-b border-red-900 pb-2">{T.errorTitle}</h3>
                  <p className="text-red-400 font-mono mb-8">{errorMsg}</p>
                  <button onClick={handleReset} className="px-6 py-2 border border-red-600 text-red-500 hover:bg-red-900/30 hover:text-red-300 transition-colors uppercase tracking-widest">
                    {T.retryButton}
                  </button>
                </div>
              </div>
            )}

            {/* Game Output */}
            <GameLog history={history} isTyping={status === GameStatus.LOADING} fontSize={fontSize} />

            {/* Game Over Panel */}
            {status === GameStatus.GAME_OVER && (
               <div className="p-6 bg-zinc-950 border-t-2 border-red-900 text-center shadow-[0_-10px_30px_rgba(0,0,0,0.8)] relative z-20">
                  <p className="text-red-500 font-bold mb-4 text-2xl tracking-[0.5em] animate-pulse">{T.gameOver}</p>
                  <button onClick={handleReset} className="px-8 py-2 border border-red-700 text-red-500 hover:bg-red-900/20 hover:text-red-300 transition-colors font-mono tracking-widest">
                    {T.restartButton}
                  </button>
               </div>
            )}

            {/* Input Area */}
            {status !== GameStatus.IDLE && status !== GameStatus.GAME_OVER && status !== GameStatus.ERROR && (
               <RetroInput 
                 onSend={handleCommand} 
                 disabled={status === GameStatus.LOADING}
                 suggestions={getSuggestions()}
                 placeholder={getDynamicPlaceholder()}
                 fontSize={fontSize}
               />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Stats */}
      <StatusPanel 
        gameState={gameState} 
        enableImages={enableImages} 
        onToggleImages={() => setEnableImages(!enableImages)}
        enableSound={enableSound}
        onToggleSound={() => setEnableSound(!enableSound)}
        enableMusic={enableMusic}
        onToggleMusic={() => setEnableMusic(!enableMusic)}
        enableCRT={enableCRT}
        onToggleCRT={() => setEnableCRT(!enableCRT)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onSave={openSaveModal}
        onLoad={openLoadModal}
        hasSaveData={hasSaveData}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenMap={() => setIsMapModalOpen(true)}
      />

      {/* Modals */}
      <SaveLoadModal
        isOpen={isSaveModalOpen}
        mode="save"
        onClose={() => setIsSaveModalOpen(false)}
        onAction={executeSave}
        slots={saveSlots}
      />
      <SaveLoadModal
        isOpen={isLoadModalOpen}
        mode="load"
        onClose={() => setIsLoadModalOpen(false)}
        onAction={executeLoad}
        slots={saveSlots}
      />
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        currentCoordinates={gameState?.coordinates}
        visitedLocations={gameState?.visitedLocations}
        language={language}
        gameVersion={selectedGame}
      />
    </div>
  );
};

export default App;
