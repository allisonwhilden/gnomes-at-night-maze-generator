'use client';

import React, { useMemo } from 'react';
import { DifficultyLevel, DifficultyConfig } from '@/lib/maze/types';
import { DIFFICULTY_CONFIGS } from '@/lib/maze/constants';
import { estimateFeasibility } from '@/lib/maze/validator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface DifficultySelectorProps {
  difficulty: DifficultyLevel;
  customConfig?: Partial<DifficultyConfig>;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onCustomConfigChange?: (config: Partial<DifficultyConfig>) => void;
}

const difficultyDescriptions: Record<DifficultyLevel, string> = {
  A: 'Easy - Large rooms, fewer walls, great for beginners',
  B: 'Medium - Medium-sized rooms, moderate complexity',
  C: 'Hard - Smaller rooms, more challenging paths',
  D: 'Expert - Tiny rooms, maximum difficulty',
  custom: 'Custom - Set your own parameters',
};

export function DifficultySelector({
  difficulty,
  customConfig,
  onDifficultyChange,
  onCustomConfigChange,
}: DifficultySelectorProps) {
  const baseConfig = DIFFICULTY_CONFIGS[difficulty];
  const currentConfig = { ...baseConfig, ...customConfig };

  const feasibility = useMemo(() => {
    if (difficulty !== 'custom') return null;
    return estimateFeasibility({
      wallDensity: currentConfig.wallDensity,
      minCooperationScore: currentConfig.minCooperationScore,
      maxRoomSize: currentConfig.maxRoomSize,
      minRoomSize: currentConfig.minRoomSize,
    });
  }, [difficulty, currentConfig.wallDensity, currentConfig.minCooperationScore, currentConfig.maxRoomSize, currentConfig.minRoomSize]);

  const getFeasibilityStyles = (score: number) => {
    if (score >= 80) {
      return { bg: 'bg-green-500', label: 'Good', badge: 'bg-green-100 text-green-700' };
    }
    if (score >= 50) {
      return { bg: 'bg-yellow-500', label: 'Risky', badge: 'bg-yellow-100 text-yellow-700' };
    }
    return { bg: 'bg-red-500', label: 'Unlikely', badge: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty Level</Label>
        <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v as DifficultyLevel)}>
          <SelectTrigger id="difficulty" className="w-full">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Level A - Easy</SelectItem>
            <SelectItem value="B">Level B - Medium</SelectItem>
            <SelectItem value="C">Level C - Hard</SelectItem>
            <SelectItem value="D">Level D - Expert</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">{difficultyDescriptions[difficulty]}</p>
      </div>

      {difficulty === 'custom' && onCustomConfigChange && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Max Room Size</Label>
              <span className="text-sm font-mono">{currentConfig.maxRoomSize} cells</span>
            </div>
            <Slider
              value={[currentConfig.maxRoomSize]}
              min={4}
              max={30}
              step={1}
              onValueChange={([value]) =>
                onCustomConfigChange({ maxRoomSize: value })
              }
            />
            <p className="text-xs text-gray-400">Smaller rooms = harder difficulty</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Wall Density</Label>
              <span className="text-sm font-mono">{(currentConfig.wallDensity * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[currentConfig.wallDensity * 100]}
              min={20}
              max={80}
              step={5}
              onValueChange={([value]) =>
                onCustomConfigChange({ wallDensity: value / 100 })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Min Cooperation Score</Label>
              <span className="text-sm font-mono">{(currentConfig.minCooperationScore * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[currentConfig.minCooperationScore * 100]}
              min={10}
              max={70}
              step={5}
              onValueChange={([value]) =>
                onCustomConfigChange({ minCooperationScore: value / 100 })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Asymmetry Factor</Label>
              <span className="text-sm font-mono">{(currentConfig.asymmetryFactor * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[currentConfig.asymmetryFactor * 100]}
              min={30}
              max={80}
              step={5}
              onValueChange={([value]) =>
                onCustomConfigChange({ asymmetryFactor: value / 100 })
              }
            />
          </div>

          {/* Feasibility Indicator */}
          {feasibility && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm">Generation Feasibility</Label>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${getFeasibilityStyles(feasibility.score).badge}`}>
                  {getFeasibilityStyles(feasibility.score).label}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getFeasibilityStyles(feasibility.score).bg}`}
                  style={{ width: `${feasibility.score}%` }}
                />
              </div>
              {feasibility.warnings.length > 0 && (
                <ul className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {feasibility.warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
