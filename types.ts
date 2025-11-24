
export interface GameState {
  narrative: string;
  locationName: string;
  inventory: string[];
  score: number;
  moves: number;
  gameOver: boolean;
  category: ResponseCategory;
  suggestions: string[];
  bgmMood: BGMMood;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model';
  text: string;
  isSystemMessage?: boolean;
  imageUrl?: string;
  isImageLoading?: boolean;
}

export enum GameStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  ERROR = 'ERROR'
}

export enum ResponseCategory {
  NORMAL = 'NORMAL',
  REPEAT = 'REPEAT',
  IMPORTANT = 'IMPORTANT'
}

export enum BGMMood {
  EXPLORATION = 'EXPLORATION', // Outdoors, Nature, Adventure
  INDOOR = 'INDOOR',           // Inside House, Safe-ish, Cozy
  DUNGEON = 'DUNGEON',         // Underground, Cave, Echoey
  MYSTERIOUS = 'MYSTERIOUS',   // Puzzles, Magic, Ancient tech
  DANGER = 'DANGER',           // Tension, Thief nearby, Low health
  BATTLE = 'BATTLE',           // Combat, Immediate threat
  VICTORY = 'VICTORY',         // Triumph, Treasure found
  GAME_OVER = 'GAME_OVER'      // Death
}

export interface Content {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface SavedGame {
  gameState: GameState;
  displayHistory: ChatMessage[];
  sessionHistory: Content[];
  timestamp: number;
  language: Language;
}

export type Language = 'ja' | 'en';