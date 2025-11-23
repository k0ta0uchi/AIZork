
export interface GameState {
  narrative: string;
  locationName: string;
  inventory: string[];
  score: number;
  moves: number;
  gameOver: boolean;
  category: ResponseCategory;
  suggestions: string[];
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
