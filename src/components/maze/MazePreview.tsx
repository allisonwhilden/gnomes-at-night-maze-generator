'use client';

import React from 'react';
import { GeneratedMaze, MazeDiagnostics } from '@/lib/maze/types';
import { MazeCanvas } from './MazeCanvas';
import { getMazeStats } from '@/lib/maze/generator';

interface MazePreviewProps {
  maze: GeneratedMaze;
  cellSize?: number;
  /** Diagnostics for failed mazes - enables visual debugging overlays */
  diagnostics?: MazeDiagnostics;
}

export function MazePreview({ maze, cellSize = 50, diagnostics }: MazePreviewProps) {
  const stats = getMazeStats(maze);

  // Filter room issues by side
  const roomIssuesA = diagnostics?.roomIssues.filter(r => r.side === 'A') ?? [];
  const roomIssuesB = diagnostics?.roomIssues.filter(r => r.side === 'B') ?? [];
  const unreachableCells = diagnostics?.unreachableCells ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
        <div className="flex flex-col items-center w-full sm:w-auto max-w-full">
          <MazeCanvas
            maze={maze}
            side="A"
            cellSize={cellSize}
            className="border border-gray-200 rounded-lg shadow-sm"
            roomIssues={roomIssuesA}
            unreachableCells={unreachableCells}
          />
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto max-w-full">
          <MazeCanvas
            maze={maze}
            side="B"
            cellSize={cellSize}
            className="border border-gray-200 rounded-lg shadow-sm"
            roomIssues={roomIssuesB}
            unreachableCells={unreachableCells}
          />
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          Difficulty: <span className="font-semibold">{maze.difficulty}</span> |
          Grid: <span className="font-semibold">{maze.gridSize}×{maze.gridSize}</span> |
          Cooperation: <span className="font-semibold">{(stats.cooperationScore * 100).toFixed(0)}%</span> |
          Seed: <span className="font-mono text-xs">{maze.seed}</span>
        </p>
      </div>
    </div>
  );
}
