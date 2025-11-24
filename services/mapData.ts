
import { Coordinates, GameVersion } from "../types";

export interface MapNode {
  nameEn: string;
  nameJa: string;
  coords: Coordinates;
}

// Static map layout database
// (0,0,0) is the starting point for each game usually
export const ZORK_MAP_DATA: Record<GameVersion, MapNode[]> = {
  [GameVersion.ZORK1]: [
    // --- SURFACE (Floor 0) ---
    { nameEn: "West of House", nameJa: "家の西", coords: { x: 0, y: 0, floor: 0 } },
    { nameEn: "North of House", nameJa: "家の北", coords: { x: 0, y: 1, floor: 0 } },
    { nameEn: "South of House", nameJa: "家の南", coords: { x: 0, y: -1, floor: 0 } },
    { nameEn: "East of House", nameJa: "家の東", coords: { x: 1, y: 0, floor: 0 } }, 
    { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: 0, floor: 0 } },
    { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: 1, floor: 0 } },
    { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: -1, floor: 0 } },
    { nameEn: "Forest Path", nameJa: "森の小道", coords: { x: 0, y: 2, floor: 0 } },
    { nameEn: "Clearing", nameJa: "空き地", coords: { x: 0, y: 3, floor: 0 } },
    { nameEn: "Canyon View", nameJa: "峡谷の眺め", coords: { x: 1, y: -1, floor: 0 } }, 

    // --- INDOOR ---
    { nameEn: "Kitchen", nameJa: "キッチン", coords: { x: 1, y: 0, floor: 0 } }, 
    { nameEn: "Living Room", nameJa: "リビング", coords: { x: 2, y: 0, floor: 0 } },
    { nameEn: "Attic", nameJa: "屋根裏", coords: { x: 1, y: 0, floor: 1 } },

    // --- UNDERGROUND ---
    { nameEn: "Cellar", nameJa: "地下室", coords: { x: 2, y: 0, floor: -1 } },
    { nameEn: "Troll Room", nameJa: "トロールの部屋", coords: { x: 2, y: 1, floor: -1 } },
    { nameEn: "East of Chasm", nameJa: "深い割れ目の東", coords: { x: 2, y: -1, floor: -1 } },
    { nameEn: "Gallery", nameJa: "画廊", coords: { x: 3, y: -1, floor: -1 } },
    { nameEn: "Studio", nameJa: "スタジオ", coords: { x: 3, y: 0, floor: -1 } },
    { nameEn: "Maze", nameJa: "迷路", coords: { x: 1, y: 1, floor: -1 } },
    { nameEn: "Reservoir South", nameJa: "貯水池の南", coords: { x: 2, y: -2, floor: -1 } },
    { nameEn: "Dam", nameJa: "ダム", coords: { x: 3, y: -2, floor: -1 } },
    { nameEn: "Dam Base", nameJa: "ダムの底", coords: { x: 3, y: -2, floor: -2 } },
    { nameEn: "Round Room", nameJa: "丸い部屋", coords: { x: 4, y: -1, floor: -1 } },
    { nameEn: "Atlantis Room", nameJa: "アトランティスの部屋", coords: { x: 4, y: -2, floor: -1 } },
    { nameEn: "Shaft Room", nameJa: "縦穴の部屋", coords: { x: 4, y: 0, floor: -1 } },
    { nameEn: "Smelly Room", nameJa: "臭い部屋", coords: { x: 4, y: -3, floor: -1 } },
    { nameEn: "Gas Room", nameJa: "ガス室", coords: { x: 5, y: -1, floor: -1 } },
    { nameEn: "Coal Mine", nameJa: "炭鉱", coords: { x: 5, y: 0, floor: -1 } },
  ],
  
  [GameVersion.ZORK2]: [
    // Placeholder for Zork 2 locations
    // Starting point often "Inside the Barrow" or similar
    { nameEn: "Inside the Barrow", nameJa: "塚の中", coords: { x: 0, y: 0, floor: 0 } },
  ],

  [GameVersion.ZORK3]: [
    // Placeholder for Zork 3 locations
    // Starting point "At the Foot of the Endless Stair"
    { nameEn: "Endless Stair", nameJa: "終わりのない階段の麓", coords: { x: 0, y: 0, floor: 0 } },
  ],

  [GameVersion.ZORK_REMIX]: [
    // Remix starts in a randomized nexus
    { nameEn: "The Nexus", nameJa: "ネクサス", coords: { x: 0, y: 0, floor: 0 } },
  ]
};