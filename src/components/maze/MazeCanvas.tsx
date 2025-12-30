'use client';

import React from 'react';
import { GeneratedMaze, Side, Treasure, Cell } from '@/lib/maze/types';
import { cellKey, getCorners } from '@/lib/maze/flood-fill';
import { TREASURE_NAMES } from '@/lib/maze/constants';

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
  const wallThickness = 4;
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

  // Render walls
  const renderWalls = () => {
    const wallElements: React.ReactNode[] = [];

    // Render outer border
    wallElements.push(
      <rect
        key="border"
        x={padding}
        y={padding}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={wallThickness * 1.5}
      />
    );

    // Render internal walls
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = { x, y };

        // Check wall to the right
        if (x < gridSize - 1) {
          const rightCell = { x: x + 1, y };
          if (hasWall(cell, rightCell)) {
            wallElements.push(
              <line
                key={`h-${x}-${y}`}
                x1={padding + (x + 1) * cellSize}
                y1={padding + y * cellSize}
                x2={padding + (x + 1) * cellSize}
                y2={padding + (y + 1) * cellSize}
                stroke="#1a1a2e"
                strokeWidth={wallThickness}
                strokeLinecap="round"
              />
            );
          }
        }

        // Check wall below
        if (y < gridSize - 1) {
          const belowCell = { x, y: y + 1 };
          if (hasWall(cell, belowCell)) {
            wallElements.push(
              <line
                key={`v-${x}-${y}`}
                x1={padding + x * cellSize}
                y1={padding + (y + 1) * cellSize}
                x2={padding + (x + 1) * cellSize}
                y2={padding + (y + 1) * cellSize}
                stroke="#1a1a2e"
                strokeWidth={wallThickness}
                strokeLinecap="round"
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
        <g key={`corner-${index}`}>
          <circle
            cx={cx}
            cy={cy}
            r={cellSize * 0.25}
            fill="#e8e8e8"
            stroke="#666"
            strokeWidth={2}
          />
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={cellSize * 0.3}
            fontWeight="bold"
            fill="#666"
          >
            {index + 1}
          </text>
        </g>
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

      return (
        <g key={`treasure-${treasure.id}`}>
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
      <rect width={totalSize} height={totalSize} fill="#f8f9fa" />

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
