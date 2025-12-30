/**
 * Flood-fill algorithm for maze reachability analysis
 * Determines which cells are reachable from a starting position
 */

import { Cell, DualMaze, Side, Direction, ReachabilityResult } from './types';
import { DIRECTION_VECTORS } from './constants';

/** Check if two cells are equal */
export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Create a cell key for Set/Map operations */
export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

/** Parse a cell key back to a Cell */
export function parseKey(key: string): Cell {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/** Check if cell is within grid bounds */
export function isInBounds(cell: Cell, gridSize: number): boolean {
  return cell.x >= 0 && cell.x < gridSize && cell.y >= 0 && cell.y < gridSize;
}

/** Get the neighbor cell in a given direction */
export function getNeighbor(cell: Cell, direction: Direction): Cell {
  const { dx, dy } = DIRECTION_VECTORS[direction];
  return { x: cell.x + dx, y: cell.y + dy };
}

/** Get all valid directions from a cell */
export function getDirections(): Direction[] {
  return ['north', 'south', 'east', 'west'];
}

/**
 * Check if there's a wall between two adjacent cells on a given side
 */
export function hasWallBetween(
  maze: DualMaze,
  cell1: Cell,
  cell2: Cell,
  side: Side
): boolean {
  for (const wall of maze.walls) {
    const matchesForward =
      cellsEqual(wall.cell1, cell1) && cellsEqual(wall.cell2, cell2);
    const matchesBackward =
      cellsEqual(wall.cell1, cell2) && cellsEqual(wall.cell2, cell1);

    if (matchesForward || matchesBackward) {
      return side === 'A' ? wall.existsOnSideA : wall.existsOnSideB;
    }
  }
  return false;
}

/**
 * Check if movement from cell1 to cell2 is possible on the given side
 */
export function canMove(
  maze: DualMaze,
  from: Cell,
  to: Cell,
  side: Side
): boolean {
  // Must be in bounds
  if (!isInBounds(to, maze.gridSize)) {
    return false;
  }

  // Must be adjacent
  const dx = Math.abs(from.x - to.x);
  const dy = Math.abs(from.y - to.y);
  if (dx + dy !== 1) {
    return false;
  }

  // Check for wall
  return !hasWallBetween(maze, from, to, side);
}

/**
 * Perform flood fill from a starting cell on one side of the maze
 * Returns all reachable cells
 */
export function floodFill(
  maze: DualMaze,
  start: Cell,
  side: Side
): ReachabilityResult {
  const visited = new Set<string>();
  const queue: Cell[] = [start];
  visited.add(cellKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const direction of getDirections()) {
      const neighbor = getNeighbor(current, direction);
      const key = cellKey(neighbor);

      if (!visited.has(key) && canMove(maze, current, neighbor, side)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  const reachableCells = Array.from(visited).map(parseKey);
  const allCells = getAllCells(maze.gridSize);
  const unreachableCells = allCells.filter(
    (cell) => !visited.has(cellKey(cell))
  );

  return { reachableCells, unreachableCells };
}

/**
 * Perform flood fill using cooperative movement (both sides)
 * A cell is reachable if EITHER side can reach it
 */
export function floodFillCooperative(
  maze: DualMaze,
  start: Cell
): ReachabilityResult {
  const visited = new Set<string>();
  const queue: Cell[] = [start];
  visited.add(cellKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const direction of getDirections()) {
      const neighbor = getNeighbor(current, direction);
      const key = cellKey(neighbor);

      // Can move if EITHER side allows it
      const canMoveA = canMove(maze, current, neighbor, 'A');
      const canMoveB = canMove(maze, current, neighbor, 'B');

      if (!visited.has(key) && (canMoveA || canMoveB)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  const reachableCells = Array.from(visited).map(parseKey);
  const allCells = getAllCells(maze.gridSize);
  const unreachableCells = allCells.filter(
    (cell) => !visited.has(cellKey(cell))
  );

  return { reachableCells, unreachableCells };
}

/**
 * Check if all cells are reachable from any corner using cooperative movement
 */
export function isFullyConnected(maze: DualMaze): boolean {
  const start = maze.corners[0];
  const { unreachableCells } = floodFillCooperative(maze, start);
  return unreachableCells.length === 0;
}

/**
 * Get all cells in the grid
 */
export function getAllCells(gridSize: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      cells.push({ x, y });
    }
  }
  return cells;
}

/**
 * Get the 4 corner cells for a grid
 */
export function getCorners(gridSize: number): Cell[] {
  return [
    { x: 0, y: 0 },                           // Top-left
    { x: gridSize - 1, y: 0 },                // Top-right
    { x: 0, y: gridSize - 1 },                // Bottom-left
    { x: gridSize - 1, y: gridSize - 1 },     // Bottom-right
  ];
}

/**
 * Find all rooms (connected regions) on a given side of the maze
 * A room is a set of cells connected without walls between them
 * Returns an array of rooms, where each room is an array of cells
 */
export function findRooms(maze: DualMaze, side: Side): Cell[][] {
  const visited = new Set<string>();
  const rooms: Cell[][] = [];
  const allCells = getAllCells(maze.gridSize);

  for (const startCell of allCells) {
    const key = cellKey(startCell);
    if (visited.has(key)) {
      continue;
    }

    // BFS to find all cells in this room
    const room: Cell[] = [];
    const queue: Cell[] = [startCell];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      room.push(current);

      for (const direction of getDirections()) {
        const neighbor = getNeighbor(current, direction);
        const neighborKey = cellKey(neighbor);

        if (!visited.has(neighborKey) && canMove(maze, current, neighbor, side)) {
          visited.add(neighborKey);
          queue.push(neighbor);
        }
      }
    }

    rooms.push(room);
  }

  return rooms;
}
