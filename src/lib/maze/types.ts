/**
 * Core type definitions for the Gnomes at Night maze generator
 */

export interface Cell {
  x: number;
  y: number;
}

export interface Wall {
  /** First cell this wall borders */
  cell1: Cell;
  /** Adjacent cell this wall separates from cell1 */
  cell2: Cell;
  /** Whether this wall exists on Side A of the board */
  existsOnSideA: boolean;
  /** Whether this wall exists on Side B of the board */
  existsOnSideB: boolean;
}

export interface Treasure {
  cell: Cell;
  id: number;
  /** Which side of the board the treasure is visible on */
  visibleOnSide: 'A' | 'B';
}

export interface DualMaze {
  /** Grid dimensions (gridSize x gridSize) */
  gridSize: number;
  /** All walls in the maze */
  walls: Wall[];
  /** The 4 corner starting positions */
  corners: Cell[];
}

export interface GeneratedMaze extends DualMaze {
  /** Treasures visible on Side A (6 total) */
  treasuresSideA: Treasure[];
  /** Treasures visible on Side B (6 total) */
  treasuresSideB: Treasure[];
  /** Difficulty level used to generate */
  difficulty: DifficultyLevel;
  /** Seed used for generation (for reproducibility) */
  seed: number;
}

export type DifficultyLevel = 'A' | 'B' | 'C' | 'D' | 'custom';

export interface DifficultyConfig {
  level: DifficultyLevel;
  /** Grid size (NxN) - always 9 for standard mazes */
  gridSize: number;
  /** Wall density - percentage of possible walls that exist (0.0 - 1.0) */
  wallDensity: number;
  /** Minimum required cooperation score (0.0 - 1.0) */
  minCooperationScore: number;
  /** How different the two sides should be (0.0 - 1.0) */
  asymmetryFactor: number;
  /** Maximum room size (number of cells) - smaller rooms = harder difficulty */
  maxRoomSize: number;
  /** Minimum room size (number of cells) - larger minimum = easier difficulty */
  minRoomSize: number;
}

export interface MazeGenerationOptions {
  difficulty: DifficultyLevel;
  customConfig?: Partial<DifficultyConfig>;
  seed?: number;
  maxAttempts?: number;
}

export interface ReachabilityResult {
  /** Cells reachable from starting position */
  reachableCells: Cell[];
  /** Cells not reachable */
  unreachableCells: Cell[];
}

export interface CooperationAnalysis {
  /** Cells reachable only using Side A */
  reachableOnlyA: Cell[];
  /** Cells reachable only using Side B */
  reachableOnlyB: Cell[];
  /** Cells reachable using either side alone */
  reachableEither: Cell[];
  /** Cells requiring cooperation (both sides needed) */
  requiresCooperation: Cell[];
  /** Cooperation score (0.0 - 1.0) */
  cooperationScore: number;
}

/** Direction for wall/movement operations */
export type Direction = 'north' | 'south' | 'east' | 'west';

/** Which side of the board */
export type Side = 'A' | 'B';

/** Tracks a single configuration adjustment made during fallback */
export interface ConfigAdjustment {
  parameter: keyof DifficultyConfig;
  originalValue: number;
  adjustedValue: number;
}

/** Result of maze generation with fallback, includes adjustment info */
export interface GenerationResult {
  maze: GeneratedMaze;
  adjustments: ConfigAdjustment[];
  wasAdjusted: boolean;
}

/** Information about a problematic room */
export interface RoomIssue {
  cells: Cell[];
  side: Side;
  size: number;
  issue: 'too_small' | 'too_large';
  limit: number;
}

/** Diagnostic information about maze validation failures */
export interface MazeDiagnostics {
  isValid: boolean;
  cooperationScore: number;
  requiredCooperationScore: number;
  cooperationMet: boolean;
  roomIssues: RoomIssue[];
  unreachableCells: Cell[];
  problems: string[];
}

/** Result when generation fails but we want to show the best attempt */
export interface FailedGenerationResult {
  maze: GeneratedMaze;
  failed: true;
  diagnostics: MazeDiagnostics;
}
