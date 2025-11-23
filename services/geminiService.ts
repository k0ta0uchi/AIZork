
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, ResponseCategory, Content } from "../types";

// Initial system instruction to set the persona and rules
const SYSTEM_INSTRUCTION = `
あなたは伝説のテキストアドベンチャーゲーム「Zork I: The Great Underground Empire (ゾーク1)」のゲームエンジン兼ゲームマスターです。
以下のルールに厳格に従ってください。

1. **役割**:
   - ユーザーのコマンド（移動、取る、調べる、攻撃など）を受け取り、ゲームの状態を更新し、結果を描写してください。
   - Zork I のオリジナルの地図、アイテム、パズル、敵（グルーやトロールなど）の配置と挙動を忠実に再現してください。
   - 最初の地点は "West of House" (白い家の西側) です。

2. **言語**:
   - 出力される「narrative（物語の描写）」、「locationName（場所名）」、「inventory（持ち物）」は、**すべて雰囲気のある日本語**に翻訳してください。
   - 原作のウィットに富んだ表現や、少し皮肉っぽいトーンも日本語で再現してください。

3. **ゲームロジックの維持**:
   - 暗闇の場所で光源がない場合は、行動を続けるとグルーに食べられてゲームオーバーになるロジックを再現してください。
   - インベントリの制限や、特定のアイテムがないと進めない場所などのパズル要素を維持してください。

4. **カテゴリ判定 (重要)**:
   - 応答には必ず以下のカテゴリを設定してください。
   - **IMPORTANT**: 初めて訪れる場所、劇的なイベントの発生、重要な発見など、視覚的な描写がふさわしい場面。
   - **REPEAT**: 既に訪れた場所の再説明、または以前と同じような状況の説明。
   - **NORMAL**: アイテムを取る、インベントリを見る、何もない、失敗したアクションなど、標準的な応答。

5. **行動提案 (Suggestions)**:
   - 現在の状況（場所、見えるアイテム、直前の出来事）に基づいて、プレイヤーが次に取るべき有効なアクションを3〜5個提案してください（suggestions配列）。
   - 例: "北へ移動", "ランタンを取る", "剣で攻撃", "手紙を読む" など簡潔に。

6. **出力フォーマット**:
   - 常に以下のJSONスキーマに従ってレスポンスを返してください。JSON以外のテキストを含めないでください。

7. **初期状態**:
   - ユーザーが "START_GAME" を送信したら、ゲームのオープニング（白い家の西側）を描写し、カテゴリを "IMPORTANT" にしてください。

注意: ユーザー入力が曖昧な場合は、ゲームマスターとして補完するか、質問を返してください。
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "ゲームの進行状況、部屋の描写、アクションの結果などを日本語で記述。Markdown形式（改行や太字）を使用可能。",
    },
    locationName: {
      type: Type.STRING,
      description: "現在のプレイヤーの場所の名前（日本語）。",
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "現在プレイヤーが所持しているアイテムのリスト（日本語）。",
    },
    score: {
      type: Type.INTEGER,
      description: "現在のスコア。",
    },
    moves: {
      type: Type.INTEGER,
      description: "これまでのターン数（移動回数）。",
    },
    gameOver: {
      type: Type.BOOLEAN,
      description: "プレイヤーが死亡したか、ゲームをクリアした場合はtrue。",
    },
    category: {
      type: Type.STRING,
      enum: [ResponseCategory.NORMAL, ResponseCategory.REPEAT, ResponseCategory.IMPORTANT],
      description: "メッセージのカテゴリ。",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "現在の状況で推奨される次のアクション（日本語で3〜5個）。",
    }
  },
  required: ["narrative", "locationName", "inventory", "score", "moves", "gameOver", "category", "suggestions"],
};

let chatSession: any = null;

export const initializeGame = async (): Promise<{ gameState: GameState, rawText: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.5,
    },
  });

  try {
    const response = await chatSession.sendMessage({ message: "START_GAME" });
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText);
    return { gameState: data as GameState, rawText };
  } catch (error) {
    console.error("Failed to initialize game:", error);
    throw error;
  }
};

export const sendCommand = async (command: string): Promise<{ gameState: GameState, rawText: string }> => {
  if (!chatSession) {
    throw new Error("Game session not initialized");
  }

  try {
    const response = await chatSession.sendMessage({ message: command });
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText);
    return { gameState: data as GameState, rawText };
  } catch (error) {
    console.error("Failed to process command:", error);
    throw error;
  }
};

export const restoreSession = async (history: Content[]): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // history needs to be strictly typed for the SDK if possible, but here we pass Content[]
  // The SDK expects { role: string, parts: { text: string }[] }[]
  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.5,
    },
    history: history
  });
};

export const generateSceneImage = async (description: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // "nano banana" corresponds to gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Vintage text adventure game art, retro 8-bit pixel art style, dithered, dark atmosphere, CRT monitor effect. Scene description: ${description}. PURE VISUALS ONLY. NO TEXT, NO LETTERS, NO WORDS, NO HUD, NO UI IN THE IMAGE.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
  }
  return null;
};
