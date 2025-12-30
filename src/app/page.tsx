'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generateMaze, generateMazeWithFallback, generateMazeWithDiagnostics, getMazeStats, generateSeed } from '@/lib/maze';
import { GeneratedMaze, DifficultyLevel, DifficultyConfig, ConfigAdjustment, MazeDiagnostics } from '@/lib/maze/types';
import { MazePreview, DifficultySelector } from '@/components/maze';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('A');
  const [customConfig, setCustomConfig] = useState<Partial<DifficultyConfig>>({});
  const [maze, setMaze] = useState<GeneratedMaze | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ConfigAdjustment[]>([]);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [diagnostics, setDiagnostics] = useState<MazeDiagnostics | null>(null);
  const [isFailed, setIsFailed] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setAdjustments([]);
    setDiagnostics(null);
    setIsFailed(false);

    try {
      if (autoAdjust) {
        const result = generateMazeWithFallback({
          difficulty,
          customConfig: difficulty === 'custom' ? customConfig : undefined,
        });
        setMaze(result.maze);
        setAdjustments(result.adjustments);

        // Update sliders to reflect adjusted values
        if (result.adjustments.length > 0 && difficulty === 'custom') {
          setCustomConfig(prev => {
            const updated = { ...prev };
            for (const adj of result.adjustments) {
              (updated as Record<string, number>)[adj.parameter] = adj.adjustedValue;
            }
            return updated;
          });
        }
      } else {
        // Use generateMazeWithDiagnostics to show best attempt even if it fails
        const result = generateMazeWithDiagnostics({
          difficulty,
          customConfig: difficulty === 'custom' ? customConfig : undefined,
        });

        if ('failed' in result && result.failed) {
          setMaze(result.maze);
          setDiagnostics(result.diagnostics);
          setIsFailed(true);
        } else {
          setMaze(result as GeneratedMaze);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate maze');
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, customConfig, autoAdjust]);

  const handleRegenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setAdjustments([]);
    setDiagnostics(null);
    setIsFailed(false);

    try {
      if (autoAdjust) {
        const result = generateMazeWithFallback({
          difficulty,
          customConfig: difficulty === 'custom' ? customConfig : undefined,
          seed: generateSeed(),
        });
        setMaze(result.maze);
        setAdjustments(result.adjustments);

        // Update sliders to reflect adjusted values
        if (result.adjustments.length > 0 && difficulty === 'custom') {
          setCustomConfig(prev => {
            const updated = { ...prev };
            for (const adj of result.adjustments) {
              (updated as Record<string, number>)[adj.parameter] = adj.adjustedValue;
            }
            return updated;
          });
        }
      } else {
        // Use generateMazeWithDiagnostics to show best attempt even if it fails
        const result = generateMazeWithDiagnostics({
          difficulty,
          customConfig: difficulty === 'custom' ? customConfig : undefined,
          seed: generateSeed(),
        });

        if ('failed' in result && result.failed) {
          setMaze(result.maze);
          setDiagnostics(result.diagnostics);
          setIsFailed(true);
        } else {
          setMaze(result as GeneratedMaze);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate maze');
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, customConfig, autoAdjust]);

  const handleDownloadPDF = useCallback(async () => {
    if (!maze) return;

    // Dynamically import pdf generator to avoid SSR issues
    const { generateMazePDF } = await import('@/lib/pdf/generator');
    await generateMazePDF(maze);
  }, [maze]);

  // Generate initial maze on mount
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Gnomes at Night Maze Generator
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Generate custom cooperative mazes for the Gnomes at Night board game.
            Each maze has two sides with different wall patterns - players must
            work together to navigate!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your maze parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DifficultySelector
                difficulty={difficulty}
                customConfig={customConfig}
                onDifficultyChange={(d) => {
                  setDifficulty(d);
                  setCustomConfig({});
                }}
                onCustomConfigChange={(config) => setCustomConfig(prev => ({ ...prev, ...config }))}
              />

              {difficulty === 'custom' && (
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="auto-adjust" className="text-sm cursor-pointer">
                    Auto-adjust invalid settings
                  </Label>
                  <Switch
                    id="auto-adjust"
                    checked={autoAdjust}
                    onCheckedChange={setAutoAdjust}
                  />
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate New Maze'}
                </Button>

                {maze && (
                  <>
                    <Button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      variant="outline"
                      className="w-full"
                    >
                      Regenerate (New Seed)
                    </Button>

                    <Button
                      onClick={handleDownloadPDF}
                      variant="secondary"
                      className="w-full"
                    >
                      Download PDF
                    </Button>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {adjustments.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
                  <p className="font-medium mb-1">Settings adjusted to generate maze:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {adjustments.map((adj, i) => (
                      <li key={i}>
                        {adj.parameter === 'maxRoomSize' && `Max room size: ${adj.originalValue} → ${adj.adjustedValue}`}
                        {adj.parameter === 'minRoomSize' && `Min room size: ${adj.originalValue} → ${adj.adjustedValue}`}
                        {adj.parameter === 'minCooperationScore' && `Min cooperation: ${(adj.originalValue * 100).toFixed(0)}% → ${(adj.adjustedValue * 100).toFixed(0)}%`}
                        {adj.parameter === 'wallDensity' && `Wall density: ${(adj.originalValue * 100).toFixed(0)}% → ${(adj.adjustedValue * 100).toFixed(0)}%`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isFailed && diagnostics && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  <p className="font-medium mb-1">This maze failed validation:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {diagnostics.problems.map((problem, i) => (
                      <li key={i}>{problem}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-red-600">
                    Problem areas are highlighted on the maze. Turn on auto-adjust or try different settings.
                  </p>
                </div>
              )}

              {maze && (
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Grid: {maze.gridSize}×{maze.gridSize}</p>
                  <p>Cooperation: {(getMazeStats(maze).cooperationScore * 100).toFixed(0)}%</p>
                  <p>Seed: <span className="font-mono">{maze.seed}</span></p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maze Preview Panel */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Maze Preview</CardTitle>
              <CardDescription>
                Side A and Side B - print double-sided for best results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maze ? (
                <MazePreview
                  maze={maze}
                  cellSize={45}
                  diagnostics={isFailed ? diagnostics ?? undefined : undefined}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  {isGenerating ? 'Generating maze...' : 'Click "Generate New Maze" to start'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>
            Based on <a href="https://boardgamegeek.com/boardgame/205766/gnomes-at-night" className="underline" target="_blank" rel="noopener noreferrer">Gnomes at Night</a> by Carlo A. Rossi
          </p>
        </footer>
      </div>
    </div>
  );
}
