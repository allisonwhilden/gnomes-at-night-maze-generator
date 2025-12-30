/**
 * Difficulty presets and constants for maze generation
 */

import { DifficultyConfig, DifficultyLevel } from './types';

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  A: {
    level: 'A',
    gridSize: 5,
    wallDensity: 0.35,
    minCooperationScore: 0.2,
    asymmetryFactor: 0.5,
  },
  B: {
    level: 'B',
    gridSize: 6,
    wallDensity: 0.45,
    minCooperationScore: 0.25,
    asymmetryFactor: 0.55,
  },
  C: {
    level: 'C',
    gridSize: 7,
    wallDensity: 0.55,
    minCooperationScore: 0.3,
    asymmetryFactor: 0.6,
  },
  D: {
    level: 'D',
    gridSize: 8,
    wallDensity: 0.65,
    minCooperationScore: 0.35,
    asymmetryFactor: 0.65,
  },
  custom: {
    level: 'custom',
    gridSize: 6,
    wallDensity: 0.5,
    minCooperationScore: 0.25,
    asymmetryFactor: 0.55,
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
