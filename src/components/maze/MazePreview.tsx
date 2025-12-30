'use client';

import React from 'react';
import { GeneratedMaze } from '@/lib/maze/types';
import { MazeCanvas } from './MazeCanvas';
import { getMazeStats } from '@/lib/maze/generator';

interface MazePreviewProps {
  maze: GeneratedMaze;
  cellSize?: number;
}

export function MazePreview({ maze, cellSize = 50 }: MazePreviewProps) {
  const stats = getMazeStats(maze);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 justify-center">
        <div className="flex flex-col items-center">
          <MazeCanvas
            maze={maze}
            side="A"
            cellSize={cellSize}
            className="border border-gray-200 rounded-lg shadow-sm"
          />
        </div>
        <div className="flex flex-col items-center">
          <MazeCanvas
            maze={maze}
            side="B"
            cellSize={cellSize}
            className="border border-gray-200 rounded-lg shadow-sm"
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
