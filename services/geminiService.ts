
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, ResponseCategory, Content, Language, BGMMood, GameVersion } from "../types";

// Helper to get game-specific context
const getGameContext = (version: GameVersion) => {
  switch (version) {
    case GameVersion.ZORK2:
      return {
        title: "Zork II: The Wizard of Frobozz",
        startLocation: "Inside the Barrow",
        keyElements: "The Wizard of Frobozz (who appears randomly casting spells), the Demon, the Carousel Room, the Dragon.",
        goal: "Explore the region, solve puzzles involving the Wizard, and control the Demon."
      };
    case GameVersion.ZORK3:
      return {
        title: "Zork III: The Dungeon Master",
        startLocation: "At the Foot of the Endless Stair",
        keyElements: "The Dungeon Master, the Time Machine, the Royal Puzzle, the Guardians.",
        goal: "Prove your worthiness to the Dungeon Master and witness the final destiny of the Great Underground Empire. Tone is more solemn and mysterious."
      };
    case GameVersion.ZORK_REMIX:
      return {
        title: "ZORK REMIX: The Glitched Empire",
        startLocation: "The Nexus of Probability (A strange void where dimensions collide)",
        keyElements: "A CHAOTIC FUSION of Zork I, II, and III. Map layout is randomized. Items from all games are scattered randomly. The Thief might steal the Wizard's wand. The Troll might be guarding the Time Machine.",
        goal: "Navigate this randomized world, find the Glitched Trophy, and restore the timeline. EXPECT THE UNEXPECTED."
      };
    case GameVersion.ZORK1:
    default:
      return {
        title: "Zork I: The Great Underground Empire",
        startLocation: "West of House",
        keyElements: "The White House, the Troll, the Thief, the Flood Control Dam, the Cyclops.",
        goal: "Explore the underground empire and collect the Twenty Treasures of Zork."
      };
  }
};

// Dynamic system instruction based on language and game version
const getSystemInstruction = (lang: Language, version: GameVersion) => {
  const ctx = getGameContext(version);
  
  let remixInstructions = "";
  if (version === GameVersion.ZORK_REMIX) {
    remixInstructions = `
    *** RANDOMIZER MODE ACTIVE ***
    - You are generating a UNIQUE, RANDOMIZED instance of the Zork universe.
    - MIX elements from Zork I, II, and III freely.
    - RANDOMIZE the map connections (e.g., North from the Living Room might lead to the Coal Mine).
    - RANDOMIZE item locations.
    - CHANGE puzzle solutions (make them logical but different from the original games).
    - Create a sense of "glitch" or "distortion" in the narrative occasionally.
    `;
  }

  return `
You are the game engine and game master for the text adventure "${ctx.title}".
Follow these rules strictly:

1. **Role**:
   - Accept user commands, update game state, and describe the outcome.
   - Faithfully simulate the map, items, puzzles, and behaviors defined in ${ctx.title}.
   - **Key Elements**: ${ctx.keyElements}
   - **Main Goal**: ${ctx.goal}
   - Start location: "${ctx.startLocation}".
   ${remixInstructions}

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

4. **Coordinate Tracking (Mapping System)**:
   - You MUST track the player's position on a 3D grid (x, y, floor).
   - **Origin**: Start location ("${ctx.startLocation}") is x:0, y:0, floor:0.
   - **Directions**: 
     - North: y + 1
     - South: y - 1
     - East: x + 1
     - West: x - 1
     - Up: floor + 1
     - Down: floor - 1
   - Return the calculated \`coordinates\` in every response.

5. **Categorization & Atmosphere**:
   - **Category**:
     - IMPORTANT: First visits, dramatic events.
     - REPEAT: Repeated actions/places.
     - NORMAL: Standard actions.
   - **BGM Mood**: Select the most appropriate background music mood (EXPLORATION, INDOOR, DUNGEON, MYSTERIOUS, DANGER, BATTLE, VICTORY, GAME_OVER).

6. **Suggestions**:
   - Provide 3-5 valid next actions based on context in the \`suggestions\` array.
   - ${lang === 'ja' ? 'Examples: "北へ移動", "剣を取る"' : 'Examples: "North", "Take Sword", "Read Book"'}

7. **Output Format**:
   - ALWAYS respond with the defined JSON schema. NO plain text.

8. **Initialization**:
   - When user sends "START_GAME", describe the opening scene and set category to "IMPORTANT" and mood to "EXPLORATION" or "DUNGEON" depending on the start.
   
Note: If user input is ambiguous, ask for clarification as the Game Master.
`;
};

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
    },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.INTEGER },
        y: { type: Type.INTEGER },
        floor: { type: Type.INTEGER },
      },
      required: ["x", "y", "floor"],
      description: "Current coordinates on 3D grid. Start point is 0,0,0.",
    }
  },
  required: ["narrative", "locationName", "inventory", "score", "moves", "gameOver", "category", "suggestions", "bgmMood", "coordinates"],
};

let chatSession: any = null;

export const initializeGame = async (lang: Language, version: GameVersion): Promise<{ gameState: GameState, rawText: string }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: getSystemInstruction(lang, version),
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.7, // Slightly higher creativity for games, especially Remix
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

export const restoreSession = async (history: Content[], lang: Language, version: GameVersion): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: getSystemInstruction(lang, version), 
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.7,
    },
    history: history
  });
};

export const generateSceneImage = async (description: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
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