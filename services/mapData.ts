
import { Coordinates } from "../types";

export interface MapNode {
  nameEn: string;
  nameJa: string;
  coords: Coordinates;
}

// Simplified static map layout for Zork I
// This serves as the "Known World" database to render the grid
// (0,0,0) is West of House
export const ZORK_MAP_DATA: MapNode[] = [
  // --- SURFACE (Floor 0) ---
  { nameEn: "West of House", nameJa: "家の西", coords: { x: 0, y: 0, floor: 0 } },
  { nameEn: "North of House", nameJa: "家の北", coords: { x: 0, y: 1, floor: 0 } },
  { nameEn: "South of House", nameJa: "家の南", coords: { x: 0, y: -1, floor: 0 } },
  { nameEn: "East of House", nameJa: "家の東", coords: { x: 1, y: 0, floor: 0 } }, // Often Behind House logic varies, keeping simple grid
  { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: 0, floor: 0 } },
  { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: 1, floor: 0 } },
  { nameEn: "Forest", nameJa: "森", coords: { x: -1, y: -1, floor: 0 } },
  { nameEn: "Forest Path", nameJa: "森の小道", coords: { x: 0, y: 2, floor: 0 } },
  { nameEn: "Clearing", nameJa: "空き地", coords: { x: 0, y: 3, floor: 0 } },
  { nameEn: "Canyon View", nameJa: "峡谷の眺め", coords: { x: 1, y: -1, floor: 0 } }, // Approx

  // --- INDOOR (Floor 0 for simplified top-down, or use logic to differentiate) ---
  // Mapping House Interior to offset grid or same floor
  { nameEn: "Kitchen", nameJa: "キッチン", coords: { x: 1, y: 0, floor: 0 } }, 
  { nameEn: "Living Room", nameJa: "リビング", coords: { x: 2, y: 0, floor: 0 } },
  { nameEn: "Attic", nameJa: "屋根裏", coords: { x: 1, y: 0, floor: 1 } },

  // --- UNDERGROUND (Floor -1, -2) ---
  { nameEn: "Cellar", nameJa: "地下室", coords: { x: 2, y: 0, floor: -1 } }, // Below Living Room
  { nameEn: "Troll Room", nameJa: "トロールの部屋", coords: { x: 2, y: 1, floor: -1 } },
  { nameEn: "East of Chasm", nameJa: "深い割れ目の東", coords: { x: 2, y: -1, floor: -1 } },
  { nameEn: "Gallery", nameJa: "画廊", coords: { x: 3, y: -1, floor: -1 } },
  { nameEn: "Studio", nameJa: "スタジオ", coords: { x: 3, y: 0, floor: -1 } },
  { nameEn: "Maze", nameJa: "迷路", coords: { x: 1, y: 1, floor: -1 } }, // Approx
  { nameEn: "Reservoir South", nameJa: "貯水池の南", coords: { x: 2, y: -2, floor: -1 } },
  { nameEn: "Dam", nameJa: "ダム", coords: { x: 3, y: -2, floor: -1 } },
  { nameEn: "Dam Base", nameJa: "ダムの底", coords: { x: 3, y: -2, floor: -2 } },
  { nameEn: "Round Room", nameJa: "丸い部屋", coords: { x: 4, y: -1, floor: -1 } },
  { nameEn: "Atlantis Room", nameJa: "アトランティスの部屋", coords: { x: 4, y: -2, floor: -1 } },
  { nameEn: "Shaft Room", nameJa: "縦穴の部屋", coords: { x: 4, y: 0, floor: -1 } },
  { nameEn: "Smelly Room", nameJa: "臭い部屋", coords: { x: 4, y: -3, floor: -1 } },
  { nameEn: "Gas Room", nameJa: "ガス室", coords: { x: 5, y: -1, floor: -1 } },
  { nameEn: "Coal Mine", nameJa: "炭鉱", coords: { x: 5, y: 0, floor: -1 } },
];
