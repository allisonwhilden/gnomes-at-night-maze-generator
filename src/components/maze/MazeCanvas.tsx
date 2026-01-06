'use client';

import React from 'react';
import { GeneratedMaze, Side, Treasure, Cell, RoomIssue } from '@/lib/maze/types';
import { cellKey, getCorners } from '@/lib/maze/flood-fill';
import {
  TREASURE_NAMES,
  TREASURE_IMAGES,
  BACKGROUND_IMAGE,
  HORIZONTAL_WALL_IMAGES,
  VERTICAL_WALL_IMAGES,
  RENDER_CONFIG,
  getWallImage,
} from '@/lib/maze/constants';

interface MazeCanvasProps {
  maze: GeneratedMaze;
  side: Side;
  cellSize?: number;
  showTreasures?: boolean;
  showCorners?: boolean;
  className?: string;
  /** Room issues to highlight (filtered to this side) */
  roomIssues?: RoomIssue[];
  /** Unreachable cells to highlight */
  unreachableCells?: Cell[];
}

export function MazeCanvas({
  maze,
  side,
  cellSize = 60,
  showTreasures = true,
  showCorners = true,
  className = '',
  roomIssues = [],
  unreachableCells = [],
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
    const wallThickness = cellSize * RENDER_CONFIG.wallThickness;

    // Render outer border using wall images
    // Top border
    for (let x = 0; x < gridSize; x++) {
      wallElements.push(
        <image
          key={`border-top-${x}`}
          href={getWallImage(HORIZONTAL_WALL_IMAGES, x, 0, 1)}
          x={padding + x * cellSize}
          y={padding - wallThickness / 2}
          width={cellSize}
          height={wallThickness}
          preserveAspectRatio="none"
        />
      );
    }
    // Bottom border
    for (let x = 0; x < gridSize; x++) {
      wallElements.push(
        <image
          key={`border-bottom-${x}`}
          href={getWallImage(HORIZONTAL_WALL_IMAGES, x, 0, 2)}
          x={padding + x * cellSize}
          y={padding + gridSize * cellSize - wallThickness / 2}
          width={cellSize}
          height={wallThickness}
          preserveAspectRatio="none"
        />
      );
    }
    // Left border
    for (let y = 0; y < gridSize; y++) {
      wallElements.push(
        <image
          key={`border-left-${y}`}
          href={getWallImage(VERTICAL_WALL_IMAGES, 0, y, 3)}
          x={padding - wallThickness / 2}
          y={padding + y * cellSize}
          width={wallThickness}
          height={cellSize}
          preserveAspectRatio="none"
        />
      );
    }
    // Right border
    for (let y = 0; y < gridSize; y++) {
      wallElements.push(
        <image
          key={`border-right-${y}`}
          href={getWallImage(VERTICAL_WALL_IMAGES, 0, y, 4)}
          x={padding + gridSize * cellSize - wallThickness / 2}
          y={padding + y * cellSize}
          width={wallThickness}
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
            wallElements.push(
              <image
                key={`wall-v-${x}-${y}`}
                href={getWallImage(VERTICAL_WALL_IMAGES, x, y, 5)}
                x={padding + (x + 1) * cellSize - wallThickness / 2}
                y={padding + y * cellSize}
                width={wallThickness}
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
            wallElements.push(
              <image
                key={`wall-h-${x}-${y}`}
                href={getWallImage(HORIZONTAL_WALL_IMAGES, x, y, 6)}
                x={padding + x * cellSize}
                y={padding + (y + 1) * cellSize - wallThickness / 2}
                width={cellSize}
                height={wallThickness}
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
          fontSize={cellSize * RENDER_CONFIG.cornerFontSize}
          fontWeight="bold"
          fill={RENDER_CONFIG.cornerTextColor}
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
      const imageSize = cellSize * RENDER_CONFIG.treasureSize;

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

  // Render problem overlays (room issues and unreachable cells)
  const renderProblemOverlays = () => {
    const overlays: React.ReactNode[] = [];

    // Highlight unreachable cells in gray
    for (const cell of unreachableCells) {
      const x = padding + cell.x * cellSize;
      const y = padding + cell.y * cellSize;
      overlays.push(
        <rect
          key={`unreachable-${cell.x}-${cell.y}`}
          x={x}
          y={y}
          width={cellSize}
          height={cellSize}
          fill="rgba(128, 128, 128, 0.5)"
          stroke="rgba(128, 128, 128, 0.8)"
          strokeWidth={1}
        />
      );
    }

    // Highlight room issues
    for (const issue of roomIssues) {
      const color = issue.issue === 'too_small'
        ? 'rgba(239, 68, 68, 0.4)'  // red for too small
        : 'rgba(251, 146, 60, 0.4)'; // orange for too large
      const strokeColor = issue.issue === 'too_small'
        ? 'rgba(239, 68, 68, 0.8)'
        : 'rgba(251, 146, 60, 0.8)';

      for (const cell of issue.cells) {
        const x = padding + cell.x * cellSize;
        const y = padding + cell.y * cellSize;
        overlays.push(
          <rect
            key={`room-issue-${issue.side}-${cell.x}-${cell.y}`}
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            fill={color}
            stroke={strokeColor}
            strokeWidth={1}
          />
        );
      }
    }

    return overlays;
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
          stroke={RENDER_CONFIG.gridLineColor}
          strokeWidth={RENDER_CONFIG.gridLineWidth}
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
          stroke={RENDER_CONFIG.gridLineColor}
          strokeWidth={RENDER_CONFIG.gridLineWidth}
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
      className={`max-w-full h-auto ${className}`}
      style={{ display: 'block' }}
    >
      {/* Background */}
      <defs>
        <pattern id={`bg-pattern-${side}`} patternUnits="userSpaceOnUse" width={totalSize} height={totalSize}>
          <image
            href={BACKGROUND_IMAGE}
            width={totalSize}
            height={totalSize}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      <rect width={totalSize} height={totalSize} fill={`url(#bg-pattern-${side})`} />

      {/* Problem overlays (rendered early so they're behind other elements) */}
      {(roomIssues.length > 0 || unreachableCells.length > 0) && renderProblemOverlays()}

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
