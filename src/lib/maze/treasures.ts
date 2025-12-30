/**
 * Treasure placement logic
 * Places 6 treasures on each side of the maze
 */

import { Cell, DualMaze, Treasure, Side } from './types';
import { TREASURES_PER_SIDE } from './constants';
import { SeededRandom } from './random';
import { getTreasureCandidates, validateTreasuresReachable } from './validator';
import { cellKey, getCorners } from './flood-fill';

/**
 * Calculate distance between two cells (Manhattan distance)
 */
function manhattanDistance(a: Cell, b: Cell): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Calculate minimum distance from a cell to any cell in a list
 */
function minDistanceToSet(cell: Cell, cells: Cell[]): number {
  if (cells.length === 0) return Infinity;
  return Math.min(...cells.map((c) => manhattanDistance(cell, c)));
}

/**
 * Score a cell based on how spread out it is from already placed treasures
 * Higher score = better (more spread out)
 */
function spreadScore(cell: Cell, placedTreasures: Cell[], gridSize: number): number {
  if (placedTreasures.length === 0) {
    // For first treasure, prefer cells away from corners
    const corners = getCorners(gridSize);
    return minDistanceToSet(cell, corners);
  }
  return minDistanceToSet(cell, placedTreasures);
}

/**
 * Place treasures on one side of the maze
 * Tries to spread them out across the board
 */
function placeTreasuresOnSide(
  maze: DualMaze,
  side: Side,
  random: SeededRandom,
  existingTreasures: Cell[] = []
): Cell[] {
  const candidates = getTreasureCandidates(maze, side, existingTreasures);
  const placed: Cell[] = [];

  for (let i = 0; i < TREASURES_PER_SIDE; i++) {
    if (candidates.length === 0) {
      throw new Error(`Not enough valid cells for treasure placement on side ${side}`);
    }

    // Score each candidate by spread
    const allPlaced = [...existingTreasures, ...placed];
    const scored = candidates.map((cell) => ({
      cell,
      score: spreadScore(cell, allPlaced, maze.gridSize),
    }));

    // Sort by score (highest first) and pick from top candidates with some randomness
    scored.sort((a, b) => b.score - a.score);

    // Pick from top 3 candidates randomly to add variety
    const topN = Math.min(3, scored.length);
    const selectedIndex = random.nextInt(0, topN);
    const selected = scored[selectedIndex].cell;

    placed.push(selected);

    // Remove selected cell from candidates
    const selectedKey = cellKey(selected);
    const idx = candidates.findIndex((c) => cellKey(c) === selectedKey);
    if (idx !== -1) {
      candidates.splice(idx, 1);
    }
  }

  return placed;
}

/**
 * Place all treasures on the maze
 * Returns treasures for both sides
 */
export function placeTreasures(
  maze: DualMaze,
  random: SeededRandom
): { treasuresSideA: Treasure[]; treasuresSideB: Treasure[] } {
  // Place treasures on side A first
  const cellsA = placeTreasuresOnSide(maze, 'A', random);

  // Place treasures on side B, avoiding cells already used
  const cellsB = placeTreasuresOnSide(maze, 'B', random, cellsA);

  // Validate all treasures are reachable
  const allCells = [...cellsA, ...cellsB];
  if (!validateTreasuresReachable(maze, allCells)) {
    throw new Error('Generated treasures are not all reachable');
  }

  // Convert to Treasure objects
  const treasuresSideA: Treasure[] = cellsA.map((cell, i) => ({
    cell,
    id: i + 1,
    visibleOnSide: 'A' as const,
  }));

  const treasuresSideB: Treasure[] = cellsB.map((cell, i) => ({
    cell,
    id: i + 7, // IDs 7-12
    visibleOnSide: 'B' as const,
  }));

  return { treasuresSideA, treasuresSideB };
}

/**
 * Get all treasure cells as a flat list
 */
export function getAllTreasureCells(
  treasuresSideA: Treasure[],
  treasuresSideB: Treasure[]
): Cell[] {
  return [
    ...treasuresSideA.map((t) => t.cell),
    ...treasuresSideB.map((t) => t.cell),
  ];
}
