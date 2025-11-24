
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, ResponseCategory, Content, Language, BGMMood } from "../types";

// Dynamic system instruction based on language
const getSystemInstruction = (lang: Language) => `
You are the game engine and game master for the legendary text adventure "Zork I: The Great Underground Empire".
Follow these rules strictly:

1. **Role**:
   - Accept user commands (move, take, examine, attack, etc.), update game state, and describe the outcome.
   - Faithfully simulate Zork I's original map, items, puzzles, and enemy behaviors (like Grues and Trolls).
   - Start location: "West of House".

2. **Language & Tone**:
   ${lang === 'ja' 
     ? '- Output "narrative", "locationName", "inventory" in **atmospheric Japanese** (translated from the original).'
     : '- Output "narrative", "locationName", "inventory" in **English**.'
   }
   - Maintain the witty, slightly sarcastic tone of the original Zork.
   ${lang === 'ja' ? '- Even in Japanese, capture the classic Zork feel.' : ''}

3. **Game Logic**:
   - Maintain the logic where moving in the dark without a light source leads to being eaten by a Grue.
   - Maintain inventory limits and puzzle dependencies.

4. **Categorization & Atmosphere**:
   - **Category**:
     - IMPORTANT: First visits, dramatic events.
     - REPEAT: Repeated actions/places.
     - NORMAL: Standard actions.
   - **BGM Mood** (Select the most appropriate background music mood):
     - **INDOOR**: Inside the white house, living room, attic. Generally safe and quiet places.
     - **DUNGEON**: The Great Underground Empire, caves, dark tunnels, cellars. Oppressive atmosphere.
     - **EXPLORATION**: Outdoors (forest, canyon), clearing. Adventurous and open feeling.
     - **MYSTERIOUS**: Encountering strange machinery (Flood Control Dam), magical effects, ancient puzzles, or mirror rooms.
     - **DANGER**: Presence of the Thief, running out of light, hearing growls, low health, or high tension moments.
     - **BATTLE**: Active combat with Troll, Cyclops, Thief, or other monsters.
     - **VICTORY**: Solving a major puzzle, defeating a boss, or obtaining a treasure.
     - **GAME_OVER**: Player has died.

5. **Suggestions**:
   - Provide 3-5 valid next actions based on context in the \`suggestions\` array.
   - ${lang === 'ja' ? 'Examples: "北へ移動", "ランタンを取る"' : 'Examples: "North", "Take Lantern", "Read Letter"'}

6. **Output Format**:
   - ALWAYS respond with the defined JSON schema. NO plain text.

7. **Initialization**:
   - When user sends "START_GAME", describe the opening scene (West of House) and set category to "IMPORTANT" and mood to "EXPLORATION".
   
Note: If user input is ambiguous, ask for clarification as the Game Master.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "Game narrative/description. Can use Markdown.",
    },
    locationName: {
      type: Type.STRING,
      description: "Current location name.",
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of items in inventory.",
    },
    score: {
      type: Type.INTEGER,
      description: "Current score.",
    },
    moves: {
      type: Type.INTEGER,
      description: "Current move count.",
    },
    gameOver: {
      type: Type.BOOLEAN,
      description: "True if player died or won.",
    },
    category: {
      type: Type.STRING,
      enum: [ResponseCategory.NORMAL, ResponseCategory.REPEAT, ResponseCategory.IMPORTANT],
      description: "Response category.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Recommended next actions (3-5 items).",
    },
    bgmMood: {
      type: Type.STRING,
      enum: [
        BGMMood.EXPLORATION, 
        BGMMood.INDOOR, 
        BGMMood.DUNGEON, 
        BGMMood.MYSTERIOUS, 
        BGMMood.DANGER, 
        BGMMood.BATTLE, 
        BGMMood.VICTORY, 
        BGMMood.GAME_OVER
      ],
      description: "Background music atmosphere.",
    }
  },
  required: ["narrative", "locationName", "inventory", "score", "moves", "gameOver", "category", "suggestions", "bgmMood"],
};

let chatSession: any = null;

export const initializeGame = async (lang: Language): Promise<{ gameState: GameState, rawText: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: getSystemInstruction(lang),
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

export const switchSessionLanguage = async (lang: Language): Promise<{ gameState: GameState, rawText: string }> => {
  if (!chatSession) {
    throw new Error("Game session not initialized");
  }

  const prompt = lang === 'ja' 
    ? "【SYSTEM COMMAND】これ以降の出力（narrative, locationName, inventory, suggestionsなど）はすべて「日本語」で行ってください。直ちに現在の状況を日本語で描写してください。" 
    : "[SYSTEM COMMAND] Output all future responses (narrative, locationName, inventory, suggestions, etc.) in ENGLISH. Immediately re-describe the current situation in English.";

  try {
    const response = await chatSession.sendMessage({ message: prompt });
    const rawText = response.text || "{}";
    const data = JSON.parse(rawText);
    return { gameState: data as GameState, rawText };
  } catch (error) {
    console.error("Failed to switch language:", error);
    throw error;
  }
};

export const restoreSession = async (history: Content[], lang: Language): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: getSystemInstruction(lang), // Restore with correct language instruction
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