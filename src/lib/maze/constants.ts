/**
 * Difficulty presets and constants for maze generation
 */

import { DifficultyConfig, DifficultyLevel } from './types';

/** Standard grid size for all mazes (9x9 like the original game) */
export const STANDARD_GRID_SIZE = 9;

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  A: {
    level: 'A',
    gridSize: STANDARD_GRID_SIZE,
    wallDensity: 0.35,
    minCooperationScore: 0.2,
    asymmetryFactor: 0.5,
    maxRoomSize: 45,
  },
  B: {
    level: 'B',
    gridSize: STANDARD_GRID_SIZE,
    wallDensity: 0.45,
    minCooperationScore: 0.25,
    asymmetryFactor: 0.55,
    maxRoomSize: 35,
  },
  C: {
    level: 'C',
    gridSize: STANDARD_GRID_SIZE,
    wallDensity: 0.55,
    minCooperationScore: 0.3,
    asymmetryFactor: 0.6,
    maxRoomSize: 25,
  },
  D: {
    level: 'D',
    gridSize: STANDARD_GRID_SIZE,
    wallDensity: 0.65,
    minCooperationScore: 0.35,
    asymmetryFactor: 0.65,
    maxRoomSize: 18,
  },
  custom: {
    level: 'custom',
    gridSize: STANDARD_GRID_SIZE,
    wallDensity: 0.5,
    minCooperationScore: 0.25,
    asymmetryFactor: 0.55,
    maxRoomSize: 30,
  },
};

/** Number of treasures per side */
export const TREASURES_PER_SIDE = 6;

/** Total treasures in the game */
export const TOTAL_TREASURES = 12;

/** Maximum generation attempts before giving up */
export const MAX_GENERATION_ATTEMPTS = 100;

/** Direction vectors for navigation */
export const DIRECTION_VECTORS = {
  north: { dx: 0, dy: -1 },
  south: { dx: 0, dy: 1 },
  east: { dx: 1, dy: 0 },
  west: { dx: -1, dy: 0 },
} as const;

/** Opposite directions */
export const OPPOSITE_DIRECTION = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
} as const;

/** Treasure names from the original game */
export const TREASURE_NAMES = [
  'Glass Key',
  'Spyglass',
  'Golden Horseshoe',
  'Map of Legends',
  'Walking Stick',
  'Ancient Book',
  'Hourglass',
  'Amulet',
  'Magic Potion',
  'Jeweled Goblet',
  'Magical Moss',
  "Dragon's Tooth",
] as const;

/** Mapping from treasure names to image file paths */
export const TREASURE_IMAGES: Record<string, string> = {
  'Glass Key': '/objects/GlassKey.png',
  'Spyglass': '/objects/Spyglass.png',
  'Golden Horseshoe': '/objects/GoldenHorseshoe.png',
  'Map of Legends': '/objects/MapOfLegends.png',
  'Walking Stick': '/objects/WalkingStick.png',
  'Ancient Book': '/objects/AncientBook.png',
  'Hourglass': '/objects/Hourglass.png',
  'Amulet': '/objects/Amulet.png',
  'Magic Potion': '/objects/MagicPotion.png',
  'Jeweled Goblet': '/objects/JeweledGoblet.png',
  'Magical Moss': '/objects/MagicalMoss.png',
  "Dragon's Tooth": '/objects/DragonsTooth.png',
};
