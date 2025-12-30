'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { generateMaze, regenerateMaze, getMazeStats } from '@/lib/maze';
import { GeneratedMaze, DifficultyLevel, DifficultyConfig } from '@/lib/maze/types';
import { MazePreview, DifficultySelector } from '@/components/maze';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('A');
  const [customConfig, setCustomConfig] = useState<Partial<DifficultyConfig>>({});
  const [maze, setMaze] = useState<GeneratedMaze | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const newMaze = generateMaze({
        difficulty,
        customConfig: difficulty === 'custom' ? customConfig : undefined,
      });
      setMaze(newMaze);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate maze');
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, customConfig]);

  const handleRegenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const newMaze = regenerateMaze({
        difficulty,
        customConfig: difficulty === 'custom' ? customConfig : undefined,
      });
      setMaze(newMaze);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate maze');
    } finally {
      setIsGenerating(false);
    }
  }, [difficulty, customConfig]);

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
                onCustomConfigChange={setCustomConfig}
              />

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
                <MazePreview maze={maze} cellSize={45} />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  {isGenerating ? 'Generating maze...' : 'Click "Generate New Maze" to start'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none">
            <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Setup</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Print the PDF double-sided</li>
                  <li>Place the board upright between two players</li>
                  <li>Each player sits on opposite sides</li>
                  <li>Place magnetic gnomes at a numbered corner</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Gameplay</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Pick a treasure to find (numbered circles)</li>
                  <li>Move only along paths on YOUR side</li>
                  <li>Walls on your side block YOU - not your partner!</li>
                  <li>Communicate to help each other reach treasures</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="text-center mt-8 text-sm text-slate-500">
          <p>
            Based on <a href="https://boardgamegeek.com/boardgame/205766/gnomes-at-night" className="underline" target="_blank" rel="noopener noreferrer">Gnomes at Night</a> by Carlo A. Rossi
          </p>
        </footer>
      </div>
    </div>
  );
}
