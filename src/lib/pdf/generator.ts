/**
 * PDF generation for Gnomes at Night mazes
 * Creates a 2-page PDF with both sides of the maze
 */

import { jsPDF } from 'jspdf';
import { GeneratedMaze, Side, Cell, Treasure } from '@/lib/maze/types';
import { cellKey, getCorners } from '@/lib/maze/flood-fill';
import { TREASURE_NAMES, TREASURE_IMAGES } from '@/lib/maze/constants';

// Page dimensions in mm (10.25" x 10.25" square)
const PAGE_SIZE = 10.25 * 25.4; // 260.35mm

// Maze rendering settings
const MARGIN = 15;

// Cache for loaded images (base64)
const imageCache: Map<string, string> = new Map();

// Background image path
const BACKGROUND_IMAGE = '/background.png';

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

/**
 * Load an image and convert to base64 data URL
 */
async function loadImageAsBase64(src: string): Promise<string> {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      imageCache.set(src, dataUrl);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Preload all treasure images
 */
async function preloadTreasureImages(): Promise<Map<string, string>> {
  const loaded = new Map<string, string>();

  for (const [name, path] of Object.entries(TREASURE_IMAGES)) {
    try {
      const base64 = await loadImageAsBase64(path);
      loaded.set(name, base64);
    } catch (error) {
      console.warn(`Failed to load treasure image for ${name}:`, error);
    }
  }

  return loaded;
}

/**
 * Preload wall images
 */
async function preloadWallImages(): Promise<{ horizontal: string[]; vertical: string[] }> {
  const horizontal: string[] = [];
  const vertical: string[] = [];

  for (const path of HORIZONTAL_WALLS) {
    try {
      const base64 = await loadImageAsBase64(path);
      horizontal.push(base64);
    } catch (error) {
      console.warn(`Failed to load horizontal wall image ${path}:`, error);
    }
  }

  for (const path of VERTICAL_WALLS) {
    try {
      const base64 = await loadImageAsBase64(path);
      vertical.push(base64);
    } catch (error) {
      console.warn(`Failed to load vertical wall image ${path}:`, error);
    }
  }

  return { horizontal, vertical };
}

interface RenderOptions {
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

function calculateRenderOptions(gridSize: number): RenderOptions {
  // Calculate cell size to fit the square page with margins (maze fills the page)
  const availableSize = PAGE_SIZE - MARGIN * 2;
  const cellSize = Math.floor(availableSize / gridSize);

  // Center the maze on the page
  const mazeSize = cellSize * gridSize;
  const offsetX = (PAGE_SIZE - mazeSize) / 2;
  const offsetY = (PAGE_SIZE - mazeSize) / 2;

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
  options: RenderOptions,
  treasureImages: Map<string, string>,
  backgroundImage: string | null,
  wallImages: { horizontal: string[]; vertical: string[] }
): void {
  const { cellSize, offsetX, offsetY } = options;
  const { gridSize } = maze;
  const treasures = side === 'A' ? maze.treasuresSideA : maze.treasuresSideB;
  const corners = getCorners(gridSize);
  const wallThickness = cellSize * 0.15;

  // Draw background image
  if (backgroundImage) {
    doc.addImage(backgroundImage, 'PNG', 0, 0, PAGE_SIZE, PAGE_SIZE);
  }

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

  // Draw outer border using wall images
  const hasHorizontalWalls = wallImages.horizontal.length > 0;
  const hasVerticalWalls = wallImages.vertical.length > 0;

  // Top border
  for (let x = 0; x < gridSize; x++) {
    if (hasHorizontalWalls) {
      const seed = x * 1000 + 1;
      const wallImage = wallImages.horizontal[Math.floor(seededRandom(seed) * wallImages.horizontal.length)];
      doc.addImage(
        wallImage,
        'PNG',
        offsetX + x * cellSize,
        offsetY - wallThickness / 2,
        cellSize,
        wallThickness
      );
    }
  }
  // Bottom border
  for (let x = 0; x < gridSize; x++) {
    if (hasHorizontalWalls) {
      const seed = x * 1000 + 2;
      const wallImage = wallImages.horizontal[Math.floor(seededRandom(seed) * wallImages.horizontal.length)];
      doc.addImage(
        wallImage,
        'PNG',
        offsetX + x * cellSize,
        offsetY + gridSize * cellSize - wallThickness / 2,
        cellSize,
        wallThickness
      );
    }
  }
  // Left border
  for (let y = 0; y < gridSize; y++) {
    if (hasVerticalWalls) {
      const seed = y * 1000 + 3;
      const wallImage = wallImages.vertical[Math.floor(seededRandom(seed) * wallImages.vertical.length)];
      doc.addImage(
        wallImage,
        'PNG',
        offsetX - wallThickness / 2,
        offsetY + y * cellSize,
        wallThickness,
        cellSize
      );
    }
  }
  // Right border
  for (let y = 0; y < gridSize; y++) {
    if (hasVerticalWalls) {
      const seed = y * 1000 + 4;
      const wallImage = wallImages.vertical[Math.floor(seededRandom(seed) * wallImages.vertical.length)];
      doc.addImage(
        wallImage,
        'PNG',
        offsetX + gridSize * cellSize - wallThickness / 2,
        offsetY + y * cellSize,
        wallThickness,
        cellSize
      );
    }
  }

  // Draw internal walls using wall images
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = { x, y };

      // Check wall to the right (vertical wall image)
      if (x < gridSize - 1) {
        const rightCell = { x: x + 1, y };
        if (hasWallBetween(maze, cell, rightCell, side) && hasVerticalWalls) {
          const seed = x * 100 + y * 10 + 5;
          const wallImage = wallImages.vertical[Math.floor(seededRandom(seed) * wallImages.vertical.length)];
          doc.addImage(
            wallImage,
            'PNG',
            offsetX + (x + 1) * cellSize - wallThickness / 2,
            offsetY + y * cellSize,
            wallThickness,
            cellSize
          );
        }
      }

      // Check wall below (horizontal wall image)
      if (y < gridSize - 1) {
        const belowCell = { x, y: y + 1 };
        if (hasWallBetween(maze, cell, belowCell, side) && hasHorizontalWalls) {
          const seed = x * 100 + y * 10 + 6;
          const wallImage = wallImages.horizontal[Math.floor(seededRandom(seed) * wallImages.horizontal.length)];
          doc.addImage(
            wallImage,
            'PNG',
            offsetX + x * cellSize,
            offsetY + (y + 1) * cellSize - wallThickness / 2,
            cellSize,
            wallThickness
          );
        }
      }
    }
  }

  // Draw corner markers
  corners.forEach((corner, index) => {
    const cx = offsetX + corner.x * cellSize + cellSize / 2;
    const cy = offsetY + corner.y * cellSize + cellSize / 2;

    doc.setFontSize(cellSize * 0.6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text(`${index + 1}`, cx, cy, { align: 'center', baseline: 'middle' });
  });

  // Draw treasures
  treasures.forEach((treasure) => {
    const cx = offsetX + treasure.cell.x * cellSize + cellSize / 2;
    const cy = offsetY + treasure.cell.y * cellSize + cellSize / 2;
    const treasureName = TREASURE_NAMES[treasure.id - 1];
    const imageData = treasureName ? treasureImages.get(treasureName) : null;
    const imageSize = cellSize * 0.75;

    if (imageData) {
      // Draw treasure image
      doc.addImage(
        imageData,
        'PNG',
        cx - imageSize / 2,
        cy - imageSize / 2,
        imageSize,
        imageSize
      );
    } else {
      // Fallback to gold circle
      const radius = cellSize * 0.3;
      doc.setFillColor(255, 215, 0);
      doc.setDrawColor(184, 134, 11);
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, radius, 'FD');

      doc.setFontSize(cellSize * 0.25);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(92, 74, 0);
      doc.text(`${treasure.id}`, cx, cy + 0.5, { align: 'center', baseline: 'middle' });
    }
  });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Draw alignment marks for double-sided printing
  const markSize = 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);

  // Top-left mark
  doc.line(5, 5, 5 + markSize, 5);
  doc.line(5, 5, 5, 5 + markSize);

  // Top-right mark
  doc.line(PAGE_SIZE - 5, 5, PAGE_SIZE - 5 - markSize, 5);
  doc.line(PAGE_SIZE - 5, 5, PAGE_SIZE - 5, 5 + markSize);

  // Bottom-left mark
  doc.line(5, PAGE_SIZE - 5, 5 + markSize, PAGE_SIZE - 5);
  doc.line(5, PAGE_SIZE - 5, 5, PAGE_SIZE - 5 - markSize);

  // Bottom-right mark
  doc.line(PAGE_SIZE - 5, PAGE_SIZE - 5, PAGE_SIZE - 5 - markSize, PAGE_SIZE - 5);
  doc.line(PAGE_SIZE - 5, PAGE_SIZE - 5, PAGE_SIZE - 5, PAGE_SIZE - 5 - markSize);
}

/**
 * Generate a PDF with both sides of the maze
 */
export async function generateMazePDF(maze: GeneratedMaze): Promise<void> {
  // Preload treasure images, background, and wall images
  const treasureImages = await preloadTreasureImages();
  const wallImages = await preloadWallImages();
  let backgroundImage: string | null = null;
  try {
    backgroundImage = await loadImageAsBase64(BACKGROUND_IMAGE);
  } catch (error) {
    console.warn('Failed to load background image:', error);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_SIZE, PAGE_SIZE], // 10.25" x 10.25" square
  });

  const options = calculateRenderOptions(maze.gridSize);

  // Render Side A on first page
  renderMazeSide(doc, maze, 'A', options, treasureImages, backgroundImage, wallImages);

  // Add second page
  doc.addPage([PAGE_SIZE, PAGE_SIZE]);

  // Render Side B on second page
  renderMazeSide(doc, maze, 'B', options, treasureImages, backgroundImage, wallImages);

  // Download the PDF
  const filename = `gnomes-maze-${maze.difficulty}-${maze.seed}.pdf`;
  doc.save(filename);
}

/**
 * Generate PDF and return as blob (for programmatic use)
 */
export async function generateMazePDFBlob(maze: GeneratedMaze): Promise<Blob> {
  // Preload treasure images, background, and wall images
  const treasureImages = await preloadTreasureImages();
  const wallImages = await preloadWallImages();
  let backgroundImage: string | null = null;
  try {
    backgroundImage = await loadImageAsBase64(BACKGROUND_IMAGE);
  } catch (error) {
    console.warn('Failed to load background image:', error);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [PAGE_SIZE, PAGE_SIZE], // 10.25" x 10.25" square
  });

  const options = calculateRenderOptions(maze.gridSize);

  renderMazeSide(doc, maze, 'A', options, treasureImages, backgroundImage, wallImages);
  doc.addPage([PAGE_SIZE, PAGE_SIZE]);
  renderMazeSide(doc, maze, 'B', options, treasureImages, backgroundImage, wallImages);

  return doc.output('blob');
}
