'use client';

import { useState, useEffect } from 'react';

interface Breakpoint {
  maxWidth: number;
  cellSize: number;
}

// Breakpoints from smallest to largest
const BREAKPOINTS: Breakpoint[] = [
  { maxWidth: 480, cellSize: 28 },   // Small mobile
  { maxWidth: 640, cellSize: 32 },   // Mobile
  { maxWidth: 768, cellSize: 36 },   // Small tablet
  { maxWidth: 1024, cellSize: 40 },  // Tablet
];

const DEFAULT_CELL_SIZE = 45; // Desktop

/**
 * Returns appropriate cellSize based on viewport width.
 * Handles SSR gracefully by returning default value initially.
 */
export function useResponsiveCellSize(): number {
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);

  useEffect(() => {
    // Function to calculate cell size based on window width
    const calculateCellSize = () => {
      const width = window.innerWidth;

      for (const bp of BREAKPOINTS) {
        if (width <= bp.maxWidth) {
          return bp.cellSize;
        }
      }
      return DEFAULT_CELL_SIZE;
    };

    // Set initial value
    setCellSize(calculateCellSize());

    // Debounced resize handler
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCellSize(calculateCellSize());
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return cellSize;
}
