/**
 * A seedable pseudo-random number generator using the Mulberry32 algorithm.
 *
 * Produces deterministic sequences of random numbers given the same seed,
 * making it suitable for reproducible game board generation.
 */
export class SeededRandom {
  private _seed: number;
  private state: number;

  /**
   * Creates a new SeededRandom instance.
   * @param seed - The seed value. If omitted, uses `Date.now()`.
   */
  constructor(seed?: number) {
    this._seed = seed ?? Date.now();
    this.state = this._seed;
  }

  /** Returns the seed this generator was initialized with. */
  get seed(): number {
    return this._seed;
  }

  /**
   * Returns the next pseudo-random float in the range [0, 1).
   *
   * Uses the Mulberry32 algorithm, a fast 32-bit PRNG with good distribution.
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  }

  /**
   * Returns a pseudo-random integer in the range [min, max] (inclusive).
   * @param min - The minimum value (inclusive).
   * @param max - The maximum value (inclusive).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}
