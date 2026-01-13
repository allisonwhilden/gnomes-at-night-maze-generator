/**
 * Main maze generation algorithm
 * Creates cooperative dual-sided mazes for Gnomes at Night
 */

import {
  Cell,
  Wall,
  DualMaze,
  GeneratedMaze,
  DifficultyConfig,
  MazeGenerationOptions,
  Direction,
  ConfigAdjustment,
  GenerationResult,
  FailedGenerationResult,
  MazeDiagnostics,
} from './types';
import { DIFFICULTY_CONFIGS, MAX_GENERATION_ATTEMPTS, DIRECTION_VECTORS } from './constants';
import { SeededRandom, generateSeed } from './random';
import {
  getAllCells,
  getCorners,
  cellKey,
  isInBounds,
  getNeighbor,
  getDirections,
} from './flood-fill';
import { isValidMaze, meetsCooperationRequirement, meetsMinimumRoomSize, meetsMaximumRoomSize, analyzeCooperation, getDiagnostics } from './validator';
import { placeTreasures } from './treasures';

/**
 * Get all possible internal walls for a grid
 * Each wall separates two adjacent cells
 */
function getAllPossibleWalls(gridSize: number): { cell1: Cell; cell2: Cell }[] {
  const walls: { cell1: Cell; cell2: Cell }[] = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = { x, y };

      // Horizontal wall (between this cell and the one to the right)
      if (x < gridSize - 1) {
        walls.push({ cell1: cell, cell2: { x: x + 1, y } });
      }

      // Vertical wall (between this cell and the one below)
      if (y < gridSize - 1) {
        walls.push({ cell1: cell, cell2: { x, y: y + 1 } });
      }
    }
  }

  return walls;
}

/**
 * Generate a base maze using recursive backtracker (DFS)
 * Returns a set of walls that should NOT exist (i.e., passages)
 */
function generateBaseMazePassages(
  gridSize: number,
  random: SeededRandom
): Set<string> {
  const passages = new Set<string>();
  const visited = new Set<string>();
  const stack: Cell[] = [];

  // Start from a random cell
  const start: Cell = {
    x: random.nextInt(0, gridSize),
    y: random.nextInt(0, gridSize),
  };

  visited.add(cellKey(start));
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // Get unvisited neighbors
    const unvisitedNeighbors: { cell: Cell; direction: Direction }[] = [];

    for (const direction of getDirections()) {
      const neighbor = getNeighbor(current, direction);
      if (isInBounds(neighbor, gridSize) && !visited.has(cellKey(neighbor))) {
        unvisitedNeighbors.push({ cell: neighbor, direction });
      }
    }

    if (unvisitedNeighbors.length > 0) {
      // Pick random unvisited neighbor
      const { cell: next } = random.pick(unvisitedNeighbors);

      // Mark passage between current and next
      const passageKey = makeWallKey(current, next);
      passages.add(passageKey);

      visited.add(cellKey(next));
      stack.push(next);
    } else {
      // Backtrack
      stack.pop();
    }
  }

  return passages;
}

/**
 * Create a consistent key for a wall between two cells
 */
function makeWallKey(cell1: Cell, cell2: Cell): string {
  // Normalize order so (a,b) and (b,a) produce same key
  if (cell1.x < cell2.x || (cell1.x === cell2.x && cell1.y < cell2.y)) {
    return `${cellKey(cell1)}-${cellKey(cell2)}`;
  }
  return `${cellKey(cell2)}-${cellKey(cell1)}`;
}

/**
 * Generate complementary maze walls for both sides
 * Creates walls that differ between sides to require cooperation
 */
function generateDualMazeWalls(
  gridSize: number,
  config: DifficultyConfig,
  random: SeededRandom
): Wall[] {
  const allPossibleWalls = getAllPossibleWalls(gridSize);
  const walls: Wall[] = [];

  // Generate base maze passages for side A
  const passagesA = generateBaseMazePassages(gridSize, random);

  // Generate different base maze for side B
  const passagesB = generateBaseMazePassages(gridSize, random);

  for (const { cell1, cell2 } of allPossibleWalls) {
    const wallKey = makeWallKey(cell1, cell2);
    const isPassageA = passagesA.has(wallKey);
    const isPassageB = passagesB.has(wallKey);

    // Determine wall existence based on passages and asymmetry
    let existsOnSideA = !isPassageA;
    let existsOnSideB = !isPassageB;

    // Apply additional randomization for asymmetry
    if (random.next() < config.asymmetryFactor * 0.3) {
      // Sometimes add extra walls to one side
      if (random.nextBoolean()) {
        existsOnSideA = existsOnSideA || random.next() < config.wallDensity;
      } else {
        existsOnSideB = existsOnSideB || random.next() < config.wallDensity;
      }
    }

    // Sometimes remove walls from one side to create cooperation opportunities
    if (random.next() < config.asymmetryFactor * 0.4) {
      if (existsOnSideA && !existsOnSideB) {
        // Wall only on A - player B can pull through
      } else if (existsOnSideB && !existsOnSideA) {
        // Wall only on B - player A can pull through
      } else if (existsOnSideA && existsOnSideB) {
        // Wall on both - randomly remove from one side
        if (random.nextBoolean()) {
          existsOnSideA = false;
        } else {
          existsOnSideB = false;
        }
      }
    }

    walls.push({
      cell1,
      cell2,
      existsOnSideA,
      existsOnSideB,
    });
  }

  return walls;
}

/**
 * Adjust maze walls to improve cooperation score
 * Creates asymmetry by adding walls to one side where paths are open
 */
function adjustForCooperation(
  maze: DualMaze,
  config: DifficultyConfig,
  random: SeededRandom
): DualMaze {
  let currentMaze = maze;
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    const analysis = analyzeCooperation(currentMaze);

    if (analysis.cooperationScore >= config.minCooperationScore) {
      break;
    }

    iterations++;

    // To increase cooperation, we need to add walls to one side
    // where both sides currently have open passages
    const newWalls = currentMaze.walls.map((wall) => {
      // For passages open on both sides, add a wall to one side
      // This blocks that side, requiring cooperation via the other
      if (!wall.existsOnSideA && !wall.existsOnSideB) {
        if (random.next() < 0.4) {
          const addToA = random.nextBoolean();
          return {
            ...wall,
            existsOnSideA: addToA,
            existsOnSideB: !addToA,
          };
        }
      }
      // For walls on both sides, remove from one to create a path
      if (wall.existsOnSideA && wall.existsOnSideB) {
        if (random.next() < 0.3) {
          const keepOnA = random.nextBoolean();
          return {
            ...wall,
            existsOnSideA: keepOnA,
            existsOnSideB: !keepOnA,
          };
        }
      }
      return wall;
    });

    currentMaze = { ...currentMaze, walls: newWalls };
  }

  return currentMaze;
}

// Track failure reasons for debugging
const failureReasons = {
  invalidMaze: 0,
  cooperationTooLow: 0,
  roomTooSmall: 0,
  roomTooLarge: 0,
};

export function getFailureReasons() {
  return { ...failureReasons };
}

export function resetFailureReasons() {
  failureReasons.invalidMaze = 0;
  failureReasons.cooperationTooLow = 0;
  failureReasons.roomTooSmall = 0;
  failureReasons.roomTooLarge = 0;
}

/**
 * Generate a single maze attempt
 */
function generateMazeAttempt(
  config: DifficultyConfig,
  random: SeededRandom
): DualMaze | null {
  const gridSize = config.gridSize;
  const walls = generateDualMazeWalls(gridSize, config, random);
  const corners = getCorners(gridSize);

  let maze: DualMaze = { gridSize, walls, corners };

  // Adjust for cooperation if needed
  maze = adjustForCooperation(maze, config, random);

  // Validate the maze
  if (!isValidMaze(maze)) {
    failureReasons.invalidMaze++;
    return null;
  }

  if (!meetsCooperationRequirement(maze, config.minCooperationScore)) {
    failureReasons.cooperationTooLow++;
    return null;
  }

  // Ensure all rooms are at least minRoomSize cells
  if (!meetsMinimumRoomSize(maze, config.minRoomSize)) {
    failureReasons.roomTooSmall++;
    return null;
  }

  // Ensure all rooms are at most maxRoomSize cells
  if (!meetsMaximumRoomSize(maze, config.maxRoomSize)) {
    failureReasons.roomTooLarge++;
    return null;
  }

  return maze;
}

/**
 * Main maze generation function
 */
export function generateMaze(options: MazeGenerationOptions): GeneratedMaze {
  const baseConfig = DIFFICULTY_CONFIGS[options.difficulty];
  const config: DifficultyConfig = {
    ...baseConfig,
    ...options.customConfig,
    level: options.difficulty,
  };

  const seed = options.seed ?? generateSeed();
  const maxAttempts = options.maxAttempts ?? MAX_GENERATION_ATTEMPTS;
  const random = new SeededRandom(seed);

  // Reset failure tracking
  resetFailureReasons();

  let maze: DualMaze | null = null;
  let attempts = 0;

  while (!maze && attempts < maxAttempts) {
    attempts++;
    maze = generateMazeAttempt(config, random);
  }

  if (!maze) {
    const reasons = getFailureReasons();
    console.error('Maze generation failure breakdown:', reasons);
    throw new Error(
      `Failed to generate valid maze after ${maxAttempts} attempts. ` +
      `Failures: invalid=${reasons.invalidMaze}, coopLow=${reasons.cooperationTooLow}, ` +
      `roomSmall=${reasons.roomTooSmall}, roomLarge=${reasons.roomTooLarge}`
    );
  }

  // Place treasures
  const { treasuresSideA, treasuresSideB } = placeTreasures(maze, random);

  return {
    ...maze,
    treasuresSideA,
    treasuresSideB,
    difficulty: options.difficulty,
    seed,
  };
}

/**
 * Get maze statistics for debugging/display
 */
export function getMazeStats(maze: GeneratedMaze) {
  const analysis = analyzeCooperation(maze);
  const totalWalls = maze.walls.length;
  const wallsOnA = maze.walls.filter((w) => w.existsOnSideA).length;
  const wallsOnB = maze.walls.filter((w) => w.existsOnSideB).length;
  const wallsOnBoth = maze.walls.filter(
    (w) => w.existsOnSideA && w.existsOnSideB
  ).length;
  const wallsOnNeither = maze.walls.filter(
    (w) => !w.existsOnSideA && !w.existsOnSideB
  ).length;

  return {
    gridSize: maze.gridSize,
    totalPossibleWalls: totalWalls,
    wallsOnSideA: wallsOnA,
    wallsOnSideB: wallsOnB,
    wallsOnBothSides: wallsOnBoth,
    openPassages: wallsOnNeither,
    cooperationScore: analysis.cooperationScore,
    cellsRequiringCooperation: analysis.requiresCooperation.length,
    totalCells: maze.gridSize * maze.gridSize,
    seed: maze.seed,
  };
}

/**
 * Relax constraints based on the dominant failure reason
 * Returns the adjusted config and the adjustment made
 */
function relaxConstraints(
  config: DifficultyConfig,
  reasons: ReturnType<typeof getFailureReasons>
): { config: DifficultyConfig; adjustment: ConfigAdjustment | null } {
  // Find the dominant failure reason
  const maxFailures = Math.max(
    reasons.roomTooLarge,
    reasons.cooperationTooLow,
    reasons.roomTooSmall,
    reasons.invalidMaze
  );

  if (maxFailures === 0) {
    return { config, adjustment: null };
  }

  // Relax the constraint causing the most failures
  if (reasons.roomTooLarge === maxFailures && config.maxRoomSize < 50) {
    const newValue = Math.min(config.maxRoomSize + 5, 50);
    return {
      config: { ...config, maxRoomSize: newValue },
      adjustment: {
        parameter: 'maxRoomSize',
        originalValue: config.maxRoomSize,
        adjustedValue: newValue,
      },
    };
  }

  if (reasons.cooperationTooLow === maxFailures && config.minCooperationScore > 0.1) {
    const newValue = Math.max(config.minCooperationScore - 0.05, 0.1);
    return {
      config: { ...config, minCooperationScore: newValue },
      adjustment: {
        parameter: 'minCooperationScore',
        originalValue: config.minCooperationScore,
        adjustedValue: newValue,
      },
    };
  }

  if (reasons.roomTooSmall === maxFailures && config.minRoomSize > 1) {
    const newValue = Math.max(config.minRoomSize - 1, 1);
    return {
      config: { ...config, minRoomSize: newValue },
      adjustment: {
        parameter: 'minRoomSize',
        originalValue: config.minRoomSize,
        adjustedValue: newValue,
      },
    };
  }

  if (reasons.invalidMaze === maxFailures && config.wallDensity > 0.2) {
    const newValue = Math.max(config.wallDensity - 0.05, 0.2);
    return {
      config: { ...config, wallDensity: newValue },
      adjustment: {
        parameter: 'wallDensity',
        originalValue: config.wallDensity,
        adjustedValue: newValue,
      },
    };
  }

  return { config, adjustment: null };
}

/**
 * Generate a maze with automatic fallback if initial settings fail
 * Relaxes constraints up to 3 times to ensure a maze is generated
 */
export function generateMazeWithFallback(options: MazeGenerationOptions): GenerationResult {
  const baseConfig = DIFFICULTY_CONFIGS[options.difficulty];
  let config: DifficultyConfig = {
    ...baseConfig,
    ...options.customConfig,
    level: options.difficulty,
  };

  const seed = options.seed ?? generateSeed();
  const maxAttempts = options.maxAttempts ?? MAX_GENERATION_ATTEMPTS;
  const maxRelaxations = 3;
  const adjustments: ConfigAdjustment[] = [];

  let maze: DualMaze | null = null;
  let relaxationRound = 0;

  while (!maze && relaxationRound <= maxRelaxations) {
    const random = new SeededRandom(seed + relaxationRound);
    resetFailureReasons();

    let attempts = 0;
    while (!maze && attempts < maxAttempts) {
      attempts++;
      maze = generateMazeAttempt(config, random);
    }

    if (!maze && relaxationRound < maxRelaxations) {
      const reasons = getFailureReasons();
      const { config: relaxedConfig, adjustment } = relaxConstraints(config, reasons);

      if (adjustment) {
        adjustments.push(adjustment);
        config = relaxedConfig;
      } else {
        // No more relaxations possible
        break;
      }
    }

    relaxationRound++;
  }

  if (!maze) {
    const reasons = getFailureReasons();
    console.error('Maze generation failure breakdown:', reasons);
    throw new Error(
      `Failed to generate valid maze after ${maxRelaxations} relaxation rounds. ` +
      `Failures: invalid=${reasons.invalidMaze}, coopLow=${reasons.cooperationTooLow}, ` +
      `roomSmall=${reasons.roomTooSmall}, roomLarge=${reasons.roomTooLarge}`
    );
  }

  // Place treasures
  const random = new SeededRandom(seed);
  const { treasuresSideA, treasuresSideB } = placeTreasures(maze, random);

  const generatedMaze: GeneratedMaze = {
    ...maze,
    treasuresSideA,
    treasuresSideB,
    difficulty: options.difficulty,
    seed,
  };

  return {
    maze: generatedMaze,
    adjustments,
    wasAdjusted: adjustments.length > 0,
  };
}

/**
 * Generate a maze without fallback - returns the best attempt with diagnostics if it fails
 * Used when auto-adjust is disabled and user wants to see what their settings produce
 */
export function generateMazeWithDiagnostics(
  options: MazeGenerationOptions
): GeneratedMaze | FailedGenerationResult {
  const baseConfig = DIFFICULTY_CONFIGS[options.difficulty];
  const config: DifficultyConfig = {
    ...baseConfig,
    ...options.customConfig,
    level: options.difficulty,
  };

  const seed = options.seed ?? generateSeed();
  const maxAttempts = options.maxAttempts ?? MAX_GENERATION_ATTEMPTS;
  const random = new SeededRandom(seed);

  // Reset failure tracking
  resetFailureReasons();

  let maze: DualMaze | null = null;
  let bestAttempt: DualMaze | null = null;
  let bestScore = -Infinity;
  let attempts = 0;

  while (!maze && attempts < maxAttempts) {
    attempts++;
    const attempt = generateMazeAttemptRaw(config, random);

    if (attempt) {
      // Score this attempt based on how close it is to valid
      const diagnostics = getDiagnostics(attempt, config);
      let score = 0;

      // Higher cooperation score is better
      score += diagnostics.cooperationScore * 30;

      // Fewer room issues is better
      score -= diagnostics.roomIssues.length * 10;

      // Fewer unreachable cells is better
      score -= diagnostics.unreachableCells.length * 5;

      // Valid maze gets a big bonus
      if (diagnostics.isValid) {
        score += 100;
        maze = attempt;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAttempt = attempt;
      }
    }
  }

  // If we found a valid maze, return it normally
  if (maze) {
    const { treasuresSideA, treasuresSideB } = placeTreasures(maze, new SeededRandom(seed));
    return {
      ...maze,
      treasuresSideA,
      treasuresSideB,
      difficulty: options.difficulty,
      seed,
    };
  }

  // Otherwise, return the best failed attempt with diagnostics
  if (bestAttempt) {
    const diagnostics = getDiagnostics(bestAttempt, config);
    const { treasuresSideA, treasuresSideB } = placeTreasures(bestAttempt, new SeededRandom(seed));

    return {
      maze: {
        ...bestAttempt,
        treasuresSideA,
        treasuresSideB,
        difficulty: options.difficulty,
        seed,
      },
      failed: true,
      diagnostics,
    };
  }

  // Fallback - should rarely happen
  throw new Error('Failed to generate any maze attempt');
}

/**
 * Raw maze attempt that returns the maze even if invalid (for diagnostic scoring)
 */
function generateMazeAttemptRaw(
  config: DifficultyConfig,
  random: SeededRandom
): DualMaze | null {
  const gridSize = config.gridSize;
  const walls = generateDualMazeWalls(gridSize, config, random);
  const corners = getCorners(gridSize);

  let maze: DualMaze = { gridSize, walls, corners };

  // Adjust for cooperation if needed
  maze = adjustForCooperation(maze, config, random);

  return maze;
}
