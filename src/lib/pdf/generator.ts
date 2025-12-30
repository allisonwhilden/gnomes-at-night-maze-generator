/**
 * PDF generation for Gnomes at Night mazes
 * Creates a 2-page PDF with both sides of the maze
 */

import { jsPDF } from 'jspdf';
import { GeneratedMaze, Side, Cell, Treasure } from '@/lib/maze/types';
import { cellKey, getCorners } from '@/lib/maze/flood-fill';
import { TREASURE_NAMES } from '@/lib/maze/constants';

// Page dimensions in mm (Letter size)
const PAGE_WIDTH = 215.9;
const PAGE_HEIGHT = 279.4;

// Maze rendering settings
const MARGIN = 20;
const WALL_WIDTH = 1.5;

interface RenderOptions {
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

function calculateRenderOptions(gridSize: number): RenderOptions {
  // Calculate cell size to fit the page with margins
  const availableWidth = PAGE_WIDTH - MARGIN * 2;
  const availableHeight = PAGE_HEIGHT - MARGIN * 2 - 30; // Extra space for title
  const maxCellSize = Math.min(availableWidth / gridSize, availableHeight / gridSize);
  const cellSize = Math.floor(maxCellSize);

  // Center the maze
  const mazeWidth = cellSize * gridSize;
  const mazeHeight = cellSize * gridSize;
  const offsetX = (PAGE_WIDTH - mazeWidth) / 2;
  const offsetY = (PAGE_HEIGHT - mazeHeight) / 2 + 10; // Offset for title

  return { cellSize, offsetX, offsetY };
}

function hasWallBetween(
  maze: GeneratedMaze,
  cell1: Cell,
  cell2: Cell,
  side: Side
): boolean {
  for (const wall of maze.walls) {
    const matchesForward =
      wall.cell1.x === cell1.x && wall.cell1.y === cell1.y &&
      wall.cell2.x === cell2.x && wall.cell2.y === cell2.y;
    const matchesBackward =
      wall.cell1.x === cell2.x && wall.cell1.y === cell2.y &&
      wall.cell2.x === cell1.x && wall.cell2.y === cell1.y;

    if (matchesForward || matchesBackward) {
      return side === 'A' ? wall.existsOnSideA : wall.existsOnSideB;
    }
  }
  return false;
}

function renderMazeSide(
  doc: jsPDF,
  maze: GeneratedMaze,
  side: Side,
  options: RenderOptions
): void {
  const { cellSize, offsetX, offsetY } = options;
  const { gridSize } = maze;
  const treasures = side === 'A' ? maze.treasuresSideA : maze.treasuresSideB;
  const corners = getCorners(gridSize);

  // Draw title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Side ${side}`, PAGE_WIDTH / 2, MARGIN, { align: 'center' });

  // Draw subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Difficulty: ${maze.difficulty} | Grid: ${gridSize}×${gridSize} | Seed: ${maze.seed}`,
    PAGE_WIDTH / 2,
    MARGIN + 6,
    { align: 'center' }
  );

  // Draw grid lines (very light)
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.1);

  for (let i = 0; i <= gridSize; i++) {
    // Vertical lines
    doc.line(
      offsetX + i * cellSize,
      offsetY,
      offsetX + i * cellSize,
      offsetY + gridSize * cellSize
    );
    // Horizontal lines
    doc.line(
      offsetX,
      offsetY + i * cellSize,
      offsetX + gridSize * cellSize,
      offsetY + i * cellSize
    );
  }

  // Draw outer border
  doc.setDrawColor(20, 20, 40);
  doc.setLineWidth(WALL_WIDTH * 1.5);
  doc.rect(offsetX, offsetY, gridSize * cellSize, gridSize * cellSize);

  // Draw internal walls
  doc.setDrawColor(20, 20, 40);
  doc.setLineWidth(WALL_WIDTH);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = { x, y };

      // Check wall to the right
      if (x < gridSize - 1) {
        const rightCell = { x: x + 1, y };
        if (hasWallBetween(maze, cell, rightCell, side)) {
          doc.line(
            offsetX + (x + 1) * cellSize,
            offsetY + y * cellSize,
            offsetX + (x + 1) * cellSize,
            offsetY + (y + 1) * cellSize
          );
        }
      }

      // Check wall below
      if (y < gridSize - 1) {
        const belowCell = { x, y: y + 1 };
        if (hasWallBetween(maze, cell, belowCell, side)) {
          doc.line(
            offsetX + x * cellSize,
            offsetY + (y + 1) * cellSize,
            offsetX + (x + 1) * cellSize,
            offsetY + (y + 1) * cellSize
          );
        }
      }
    }
  }

  // Draw corner markers
  corners.forEach((corner, index) => {
    const cx = offsetX + corner.x * cellSize + cellSize / 2;
    const cy = offsetY + corner.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.25;

    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, radius, 'FD');

    doc.setFontSize(cellSize * 0.3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`${index + 1}`, cx, cy + 1, { align: 'center', baseline: 'middle' });
  });

  // Draw treasures
  treasures.forEach((treasure) => {
    const cx = offsetX + treasure.cell.x * cellSize + cellSize / 2;
    const cy = offsetY + treasure.cell.y * cellSize + cellSize / 2;
    const radius = cellSize * 0.3;

    // Gold circle
    doc.setFillColor(255, 215, 0);
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, radius, 'FD');

    // Treasure number
    doc.setFontSize(cellSize * 0.25);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(92, 74, 0);
    doc.text(`${treasure.id}`, cx, cy + 0.5, { align: 'center', baseline: 'middle' });
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Draw instructions at bottom
  const instructionY = offsetY + gridSize * cellSize + 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Numbered corners (1-4) are starting positions. Gold circles are treasures.',
    PAGE_WIDTH / 2,
    instructionY,
    { align: 'center' }
  );
  doc.text(
    'Players can only move along paths on their side. Communicate to navigate!',
    PAGE_WIDTH / 2,
    instructionY + 4,
    { align: 'center' }
  );

  // Draw alignment marks for double-sided printing
  const markSize = 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);

  // Top-left mark
  doc.line(5, 5, 5 + markSize, 5);
  doc.line(5, 5, 5, 5 + markSize);

  // Top-right mark
  doc.line(PAGE_WIDTH - 5, 5, PAGE_WIDTH - 5 - markSize, 5);
  doc.line(PAGE_WIDTH - 5, 5, PAGE_WIDTH - 5, 5 + markSize);

  // Bottom-left mark
  doc.line(5, PAGE_HEIGHT - 5, 5 + markSize, PAGE_HEIGHT - 5);
  doc.line(5, PAGE_HEIGHT - 5, 5, PAGE_HEIGHT - 5 - markSize);

  // Bottom-right mark
  doc.line(PAGE_WIDTH - 5, PAGE_HEIGHT - 5, PAGE_WIDTH - 5 - markSize, PAGE_HEIGHT - 5);
  doc.line(PAGE_WIDTH - 5, PAGE_HEIGHT - 5, PAGE_WIDTH - 5, PAGE_HEIGHT - 5 - markSize);
}

/**
 * Generate a PDF with both sides of the maze
 */
export async function generateMazePDF(maze: GeneratedMaze): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const options = calculateRenderOptions(maze.gridSize);

  // Render Side A on first page
  renderMazeSide(doc, maze, 'A', options);

  // Add second page
  doc.addPage();

  // Render Side B on second page
  renderMazeSide(doc, maze, 'B', options);

  // Download the PDF
  const filename = `gnomes-maze-${maze.difficulty}-${maze.seed}.pdf`;
  doc.save(filename);
}

/**
 * Generate PDF and return as blob (for programmatic use)
 */
export function generateMazePDFBlob(maze: GeneratedMaze): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const options = calculateRenderOptions(maze.gridSize);

  renderMazeSide(doc, maze, 'A', options);
  doc.addPage();
  renderMazeSide(doc, maze, 'B', options);

  return doc.output('blob');
}
