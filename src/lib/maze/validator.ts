/**
 * Cooperation validation system
 * Ensures generated mazes require cooperation between both players
 */

import { Cell, DualMaze, CooperationAnalysis, Side } from './types';
import {
  floodFill,
  floodFillCooperative,
  getAllCells,
  cellKey,
  getCorners,
  findRooms,
} from './flood-fill';

/**
 * Analyze a maze's cooperation requirements
 * Determines which cells require cooperation to reach
 */
export function analyzeCooperation(maze: DualMaze): CooperationAnalysis {
  const allCells = getAllCells(maze.gridSize);
  const corners = getCorners(maze.gridSize);

  // Get reachability from all corners for each side
  const reachableASets: Set<string>[] = [];
  const reachableBSets: Set<string>[] = [];
  const reachableCoopSets: Set<string>[] = [];

  for (const corner of corners) {
    const resultA = floodFill(maze, corner, 'A');
    const resultB = floodFill(maze, corner, 'B');
    const resultCoop = floodFillCooperative(maze, corner);

    reachableASets.push(new Set(resultA.reachableCells.map(cellKey)));
    reachableBSets.push(new Set(resultB.reachableCells.map(cellKey)));
    reachableCoopSets.push(new Set(resultCoop.reachableCells.map(cellKey)));
  }

  // Union all reachability sets
  const reachableA = new Set<string>();
  const reachableB = new Set<string>();
  const reachableCoop = new Set<string>();

  for (let i = 0; i < corners.length; i++) {
    reachableASets[i].forEach((key) => reachableA.add(key));
    reachableBSets[i].forEach((key) => reachableB.add(key));
    reachableCoopSets[i].forEach((key) => reachableCoop.add(key));
  }

  // Categorize each cell
  const reachableOnlyA: Cell[] = [];
  const reachableOnlyB: Cell[] = [];
  const reachableEither: Cell[] = [];
  const requiresCooperation: Cell[] = [];

  for (const cell of allCells) {
    const key = cellKey(cell);
    const inA = reachableA.has(key);
    const inB = reachableB.has(key);
    const inCoop = reachableCoop.has(key);

    if (inCoop && !inA && !inB) {
      // Only reachable via cooperation
      requiresCooperation.push(cell);
    } else if (inA && !inB) {
      // Only reachable by side A alone
      reachableOnlyA.push(cell);
    } else if (inB && !inA) {
      // Only reachable by side B alone
      reachableOnlyB.push(cell);
    } else if (inA && inB) {
      // Reachable by either side alone
      reachableEither.push(cell);
    }
  }

  // Calculate cooperation score based on asymmetry
  // For Gnomes at Night, cooperation is needed when cells are
  // reachable by only one side (players must communicate/help each other)
  const totalCells = maze.gridSize * maze.gridSize;
  const asymmetricCells = reachableOnlyA.length + reachableOnlyB.length + requiresCooperation.length;
  const cooperationScore = asymmetricCells / totalCells;

  return {
    reachableOnlyA,
    reachableOnlyB,
    reachableEither,
    requiresCooperation,
    cooperationScore,
  };
}

/**
 * Check if a maze meets minimum cooperation requirements
 */
export function meetsCooperationRequirement(
  maze: DualMaze,
  minScore: number
): boolean {
  const analysis = analyzeCooperation(maze);
  return analysis.cooperationScore >= minScore;
}

/**
 * Check if the maze is fully connected when using cooperation
 */
export function isValidMaze(maze: DualMaze): boolean {
  const corners = getCorners(maze.gridSize);

  // Check that all cells are reachable from any corner via cooperation
  const { unreachableCells } = floodFillCooperative(maze, corners[0]);
  if (unreachableCells.length > 0) {
    return false;
  }

  // Check that all corners can reach each other
  const firstCornerReachable = new Set(
    floodFillCooperative(maze, corners[0]).reachableCells.map(cellKey)
  );

  for (let i = 1; i < corners.length; i++) {
    if (!firstCornerReachable.has(cellKey(corners[i]))) {
      return false;
    }
  }

  return true;
}

/** Minimum number of cells required for a room to be valid */
export const MIN_ROOM_SIZE = 3;

/**
 * Check if all rooms on both sides of the maze meet the minimum size requirement
 * Rooms must have at least MIN_ROOM_SIZE cells (default: 3)
 */
export function meetsMinimumRoomSize(
  maze: DualMaze,
  minSize: number = MIN_ROOM_SIZE
): boolean {
  // Check rooms on side A
  const roomsA = findRooms(maze, 'A');
  for (const room of roomsA) {
    if (room.length < minSize) {
      return false;
    }
  }

  // Check rooms on side B
  const roomsB = findRooms(maze, 'B');
  for (const room of roomsB) {
    if (room.length < minSize) {
      return false;
    }
  }

  return true;
}

/**
 * Check if all rooms on both sides of the maze meet the maximum size requirement
 * Smaller max room size = harder difficulty (more cramped spaces)
 */
export function meetsMaximumRoomSize(
  maze: DualMaze,
  maxSize: number
): boolean {
  // Check rooms on side A
  const roomsA = findRooms(maze, 'A');
  for (const room of roomsA) {
    if (room.length > maxSize) {
      return false;
    }
  }

  // Check rooms on side B
  const roomsB = findRooms(maze, 'B');
  for (const room of roomsB) {
    if (room.length > maxSize) {
      return false;
    }
  }

  return true;
}

/**
 * Get cells that would be good candidates for treasure placement
 * Prioritizes cells that require cooperation to reach
 */
export function getTreasureCandidates(
  maze: DualMaze,
  side: Side,
  excludeCells: Cell[] = []
): Cell[] {
  const analysis = analyzeCooperation(maze);
  const excludeSet = new Set(excludeCells.map(cellKey));
  const corners = getCorners(maze.gridSize);
  const cornerSet = new Set(corners.map(cellKey));

  // Priority 1: Cells requiring cooperation
  // Priority 2: Cells reachable by this side only
  // Priority 3: Cells reachable by either side

  const candidates: Cell[] = [];

  // Add cooperation-required cells first (best for gameplay)
  for (const cell of analysis.requiresCooperation) {
    const key = cellKey(cell);
    if (!excludeSet.has(key) && !cornerSet.has(key)) {
      candidates.push(cell);
    }
  }

  // Add side-specific cells
  const sideSpecific = side === 'A' ? analysis.reachableOnlyA : analysis.reachableOnlyB;
  for (const cell of sideSpecific) {
    const key = cellKey(cell);
    if (!excludeSet.has(key) && !cornerSet.has(key)) {
      candidates.push(cell);
    }
  }

  // Add cells reachable by either side
  for (const cell of analysis.reachableEither) {
    const key = cellKey(cell);
    if (!excludeSet.has(key) && !cornerSet.has(key)) {
      candidates.push(cell);
    }
  }

  return candidates;
}

/**
 * Validate that all treasures are reachable via cooperation
 */
export function validateTreasuresReachable(
  maze: DualMaze,
  treasures: Cell[]
): boolean {
  const corners = getCorners(maze.gridSize);
  const { reachableCells } = floodFillCooperative(maze, corners[0]);
  const reachableSet = new Set(reachableCells.map(cellKey));

  return treasures.every((t) => reachableSet.has(cellKey(t)));
}
