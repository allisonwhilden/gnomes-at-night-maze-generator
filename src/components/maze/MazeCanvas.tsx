'use client';

import React from 'react';
import { GeneratedMaze, Side, Treasure, Cell } from '@/lib/maze/types';
import { cellKey, getCorners } from '@/lib/maze/flood-fill';
import { TREASURE_NAMES, TREASURE_IMAGES } from '@/lib/maze/constants';

// Wall image assets
const HORIZONTAL_WALLS = [
  '/walls/horizontal1.png',
  '/walls/horizontal2.png',
  '/walls/horizontal3.png',
];
const VERTICAL_WALLS = [
  '/walls/vertical1.png',
  '/walls/vertical2.png',
  '/walls/vertical3.png',
];

// Simple seeded random for consistent wall selection
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface MazeCanvasProps {
  maze: GeneratedMaze;
  side: Side;
  cellSize?: number;
  showTreasures?: boolean;
  showCorners?: boolean;
  className?: string;
}

export function MazeCanvas({
  maze,
  side,
  cellSize = 60,
  showTreasures = true,
  showCorners = true,
  className = '',
}: MazeCanvasProps) {
  const { gridSize, walls, treasuresSideA, treasuresSideB } = maze;
  const treasures = side === 'A' ? treasuresSideA : treasuresSideB;
  const corners = getCorners(gridSize);

  const padding = 20;
  const totalSize = gridSize * cellSize + padding * 2;

  // Create a set of walls for this side for efficient lookup
  const wallSet = new Map<string, boolean>();
  for (const wall of walls) {
    const exists = side === 'A' ? wall.existsOnSideA : wall.existsOnSideB;
    const key = `${cellKey(wall.cell1)}-${cellKey(wall.cell2)}`;
    const keyReverse = `${cellKey(wall.cell2)}-${cellKey(wall.cell1)}`;
    wallSet.set(key, exists);
    wallSet.set(keyReverse, exists);
  }

  const hasWall = (cell1: Cell, cell2: Cell): boolean => {
    const key = `${cellKey(cell1)}-${cellKey(cell2)}`;
    return wallSet.get(key) ?? false;
  };

  // Render walls using image assets
  const renderWalls = () => {
    const wallElements: React.ReactNode[] = [];
    const wallImageThickness = cellSize * 0.15; // Wall image thickness

    // Render outer border using wall images
    // Top border
    for (let x = 0; x < gridSize; x++) {
      const seed = x * 1000 + 1;
      const wallImage = HORIZONTAL_WALLS[Math.floor(seededRandom(seed) * HORIZONTAL_WALLS.length)];
      wallElements.push(
        <image
          key={`border-top-${x}`}
          href={wallImage}
          x={padding + x * cellSize}
          y={padding - wallImageThickness / 2}
          width={cellSize}
          height={wallImageThickness}
          preserveAspectRatio="none"
        />
      );
    }
    // Bottom border
    for (let x = 0; x < gridSize; x++) {
      const seed = x * 1000 + 2;
      const wallImage = HORIZONTAL_WALLS[Math.floor(seededRandom(seed) * HORIZONTAL_WALLS.length)];
      wallElements.push(
        <image
          key={`border-bottom-${x}`}
          href={wallImage}
          x={padding + x * cellSize}
          y={padding + gridSize * cellSize - wallImageThickness / 2}
          width={cellSize}
          height={wallImageThickness}
          preserveAspectRatio="none"
        />
      );
    }
    // Left border
    for (let y = 0; y < gridSize; y++) {
      const seed = y * 1000 + 3;
      const wallImage = VERTICAL_WALLS[Math.floor(seededRandom(seed) * VERTICAL_WALLS.length)];
      wallElements.push(
        <image
          key={`border-left-${y}`}
          href={wallImage}
          x={padding - wallImageThickness / 2}
          y={padding + y * cellSize}
          width={wallImageThickness}
          height={cellSize}
          preserveAspectRatio="none"
        />
      );
    }
    // Right border
    for (let y = 0; y < gridSize; y++) {
      const seed = y * 1000 + 4;
      const wallImage = VERTICAL_WALLS[Math.floor(seededRandom(seed) * VERTICAL_WALLS.length)];
      wallElements.push(
        <image
          key={`border-right-${y}`}
          href={wallImage}
          x={padding + gridSize * cellSize - wallImageThickness / 2}
          y={padding + y * cellSize}
          width={wallImageThickness}
          height={cellSize}
          preserveAspectRatio="none"
        />
      );
    }

    // Render internal walls
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = { x, y };

        // Check wall to the right (vertical wall image)
        if (x < gridSize - 1) {
          const rightCell = { x: x + 1, y };
          if (hasWall(cell, rightCell)) {
            const seed = x * 100 + y * 10 + 5;
            const wallImage = VERTICAL_WALLS[Math.floor(seededRandom(seed) * VERTICAL_WALLS.length)];
            wallElements.push(
              <image
                key={`wall-v-${x}-${y}`}
                href={wallImage}
                x={padding + (x + 1) * cellSize - wallImageThickness / 2}
                y={padding + y * cellSize}
                width={wallImageThickness}
                height={cellSize}
                preserveAspectRatio="none"
              />
            );
          }
        }

        // Check wall below (horizontal wall image)
        if (y < gridSize - 1) {
          const belowCell = { x, y: y + 1 };
          if (hasWall(cell, belowCell)) {
            const seed = x * 100 + y * 10 + 6;
            const wallImage = HORIZONTAL_WALLS[Math.floor(seededRandom(seed) * HORIZONTAL_WALLS.length)];
            wallElements.push(
              <image
                key={`wall-h-${x}-${y}`}
                href={wallImage}
                x={padding + x * cellSize}
                y={padding + (y + 1) * cellSize - wallImageThickness / 2}
                width={cellSize}
                height={wallImageThickness}
                preserveAspectRatio="none"
              />
            );
          }
        }
      }
    }

    return wallElements;
  };

  // Render corner markers
  const renderCorners = () => {
    if (!showCorners) return null;

    return corners.map((corner, index) => {
      const cx = padding + corner.x * cellSize + cellSize / 2;
      const cy = padding + corner.y * cellSize + cellSize / 2;

      return (
        <text
          key={`corner-${index}`}
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={cellSize * 0.6}
          fontWeight="bold"
          fill="#333"
        >
          {index + 1}
        </text>
      );
    });
  };

  // Render treasures
  const renderTreasures = () => {
    if (!showTreasures) return null;

    return treasures.map((treasure) => {
      const cx = padding + treasure.cell.x * cellSize + cellSize / 2;
      const cy = padding + treasure.cell.y * cellSize + cellSize / 2;
      const treasureName = TREASURE_NAMES[treasure.id - 1] || `Treasure ${treasure.id}`;
      const treasureImage = TREASURE_IMAGES[treasureName];
      const imageSize = cellSize * 0.75;

      return (
        <g key={`treasure-${treasure.id}`}>
          {treasureImage ? (
            <image
              href={treasureImage}
              x={cx - imageSize / 2}
              y={cy - imageSize / 2}
              width={imageSize}
              height={imageSize}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={cellSize * 0.35}
                fill="#ffd700"
                stroke="#b8860b"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={cellSize * 0.25}
                fontWeight="bold"
                fill="#5c4a00"
              >
                {treasure.id}
              </text>
            </>
          )}
          <title>{treasureName}</title>
        </g>
      );
    });
  };

  // Render grid lines (subtle)
  const renderGrid = () => {
    const gridLines: React.ReactNode[] = [];

    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      gridLines.push(
        <line
          key={`gv-${i}`}
          x1={padding + i * cellSize}
          y1={padding}
          x2={padding + i * cellSize}
          y2={padding + gridSize * cellSize}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
      // Horizontal lines
      gridLines.push(
        <line
          key={`gh-${i}`}
          x1={padding}
          y1={padding + i * cellSize}
          x2={padding + gridSize * cellSize}
          y2={padding + i * cellSize}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
    }

    return gridLines;
  };

  return (
    <svg
      width={totalSize}
      height={totalSize}
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className={className}
    >
      {/* Background */}
      <defs>
        <pattern id={`bg-pattern-${side}`} patternUnits="userSpaceOnUse" width={totalSize} height={totalSize}>
          <image
            href="/background.png"
            width={totalSize}
            height={totalSize}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      <rect width={totalSize} height={totalSize} fill={`url(#bg-pattern-${side})`} />

      {/* Grid lines */}
      {renderGrid()}

      {/* Walls */}
      {renderWalls()}

      {/* Corner markers */}
      {renderCorners()}

      {/* Treasures */}
      {renderTreasures()}

      {/* Side label */}
      <text
        x={totalSize / 2}
        y={padding - 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight="bold"
        fill="#333"
      >
        Side {side}
      </text>
    </svg>
  );
}
