
import React, { useState, useEffect } from 'react';
import { initializeGame, sendCommand, generateSceneImage, restoreSession, switchSessionLanguage } from './services/geminiService';
import { playInputSound, playResponseSound, playImportantSound, playGameOverSound, setMute, playBGM, stopBGM, setBgmMute } from './services/audioService';
import { GameState, ChatMessage, GameStatus, ResponseCategory, Content, SavedGame, Language, BGMMood, GameVersion } from './types';
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
  const [enableImages, setEnableImages] = useState<boolean>(true);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [enableMusic, setEnableMusic] = useState<boolean>(true);
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
    if (status === GameStatus.GAME_OVER) {
       playGameOverSound();
       stopBGM();
       return;
    }

    if (gameState?.bgmMood) {
      playBGM(gameState.bgmMood);
    } else {
      stopBGM();
    }
  }, [gameState?.bgmMood, status]);

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

  const processGameState = (newState: GameState, rawText: string) => {
    const messageId = Date.now().toString();
    const newMessage: ChatMessage = {
      id: messageId,
      role: 'model',
      text: newState.narrative,
    };

    setSessionHistory(prev => [...prev, { role: 'model', parts: [{ text: rawText }] }]);

    if (newState.gameOver) {
      // BGM handled in effect
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
  
  const handleStart = async (version: GameVersion) => {
    playInputSound();
    setSelectedGame(version);
    setStatus(GameStatus.LOADING);
    setHistory([{ id: 'connecting', role: 'model', text: T.connecting }]);
    setSessionHistory([]); 
    try {
      const { gameState, rawText } = await initializeGame(language, version);
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
      
      // Basic version check
      if (saveData.gameVersion && saveData.gameVersion !== selectedGame && status !== GameStatus.IDLE) {
          // If already playing a game, don't allow cross-loading without warning
          // But for simplicity, we'll allow it if from title screen logic handles it
      }
      
      // Update selected game to match save
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

  // Determine dynamic placeholder text
  const getDynamicPlaceholder = () => {
    if (status !== GameStatus.PLAYING && status !== GameStatus.GAME_OVER) return T.placeholder;
    
    if (gameState?.suggestions && gameState.suggestions.length > 0) {
      return `${T.hintPrefix}${gameState.suggestions[0]} ...`;
    }
    
    return T.placeholder;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black selection:bg-green-900 selection:text-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-zinc-900 border-b border-green-800 z-20 px-4 py-2 flex justify-between items-center text-green-500 text-xs font-mono shadow-md">
        <span className="truncate max-w-[50%]">{gameState?.locationName || (selectedGame === GameVersion.ZORK_REMIX ? 'ZORK REMIX' : selectedGame)}</span>
        <div className="flex items-center space-x-4">
          <span>SCR: {gameState?.score || 0}</span>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 border border-green-800 rounded bg-green-900/20 hover:bg-green-800/40 text-green-400"
          >
            {/* Hamburger Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col relative w-full h-full pt-10 md:pt-0">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          
          {/* Start Screen Overlay */}
          {status === GameStatus.IDLE && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-30 overflow-y-auto">
              <div className="text-center space-y-6 p-8 border-4 border-green-800 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)] bg-zinc-950 max-w-lg mx-4 my-8">
                <h1 className="text-6xl md:text-8xl font-bold text-green-500 tracking-tighter font-['VT323'] animate-crt">ZORK</h1>
                <h2 className="text-xl text-green-700 tracking-widest uppercase mb-6">Interactive Fiction Saga</h2>
                <p className="text-green-400 font-mono text-sm md:text-base whitespace-pre-wrap mb-6">
                  {T.titleSub}
                </p>
                
                <div className="flex flex-col space-y-3 w-full max-w-xs mx-auto">
                  <button 
                    onClick={() => handleStart(GameVersion.ZORK1)}
                    className="px-4 py-3 bg-green-900/40 hover:bg-green-700 text-green-100 font-bold rounded border border-green-500 transition-colors font-mono text-lg flex flex-col items-center group"
                  >
                    <span>ZORK I</span>
                    <span className="text-xs text-green-400 group-hover:text-green-200">The Great Underground Empire</span>
                  </button>

                  <button 
                    onClick={() => handleStart(GameVersion.ZORK2)}
                    className="px-4 py-3 bg-green-900/20 hover:bg-green-700 text-green-300 font-bold rounded border border-green-800 hover:border-green-500 transition-colors font-mono text-lg flex flex-col items-center group"
                  >
                    <span>ZORK II</span>
                    <span className="text-xs text-green-600 group-hover:text-green-200">The Wizard of Frobozz</span>
                  </button>

                  <button 
                    onClick={() => handleStart(GameVersion.ZORK3)}
                    className="px-4 py-3 bg-green-900/20 hover:bg-green-700 text-green-300 font-bold rounded border border-green-800 hover:border-green-500 transition-colors font-mono text-lg flex flex-col items-center group"
                  >
                    <span>ZORK III</span>
                    <span className="text-xs text-green-600 group-hover:text-green-200">The Dungeon Master</span>
                  </button>

                  {/* Remix Button */}
                  <button 
                    onClick={() => handleStart(GameVersion.ZORK_REMIX)}
                    className="px-4 py-3 bg-purple-900/20 hover:bg-purple-800/50 text-purple-300 font-bold rounded border border-purple-800 hover:border-purple-500 transition-colors font-mono text-lg flex flex-col items-center group mt-4 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  >
                    <span className="animate-pulse text-fuchsia-400 tracking-widest">ZORK REMIX</span>
                    <span className="text-xs text-purple-500 group-hover:text-purple-300">Infinite Probability Randomizer</span>
                  </button>

                  {hasSaveData && (
                    <div className="pt-4 border-t border-green-900/50 mt-2">
                       <button 
                        onClick={openLoadModal}
                        className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-green-400 font-bold rounded border border-green-800 transition-colors font-mono text-lg"
                      >
                        {T.loadButton}
                      </button>
                    </div>
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
               placeholder={getDynamicPlaceholder()}
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
        enableMusic={enableMusic}
        onToggleMusic={() => setEnableMusic(!enableMusic)}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onSave={openSaveModal}
        onLoad={openLoadModal}
        hasSaveData={hasSaveData}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenMap={() => setIsMapModalOpen(true)}
      />

      {/* Save/Load Modal */}
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

      {/* Map Modal */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        currentCoordinates={gameState?.coordinates}
        language={language}
        gameVersion={selectedGame}
      />
    </div>
  );
};

export default App;