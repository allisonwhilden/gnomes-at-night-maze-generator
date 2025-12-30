/**
 * Seeded random number generator for reproducible maze generation
 * Uses a simple mulberry32 PRNG
 */

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Get the current seed state */
  getSeed(): number {
    return this.state;
  }

  /** Generate next random number between 0 and 1 */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Generate random integer between min (inclusive) and max (exclusive) */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /** Generate random boolean with given probability of true */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /** Shuffle array in place using Fisher-Yates */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Pick random element from array */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /** Pick n random elements from array (without replacement) */
  pickN<T>(array: T[], n: number): T[] {
    const copy = [...array];
    this.shuffle(copy);
    return copy.slice(0, n);
  }
}

/** Generate a random seed */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}
