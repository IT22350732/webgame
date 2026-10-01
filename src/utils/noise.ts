import { createNoise2D } from 'simplex-noise';
import { SeededRandom } from './random';

export class TerrainNoise {
  private noise2D: (x: number, y: number) => number;

  constructor(seed: number = 42) {
    const rng = new SeededRandom(seed);
    this.noise2D = createNoise2D(() => rng.next());
  }

  public setSeed(seed: number) {
    const rng = new SeededRandom(seed);
    this.noise2D = createNoise2D(() => rng.next());
  }

  // Returns value in [-1, 1]
  public sample2D(x: number, y: number): number {
    return this.noise2D(x, y);
  }

  // Fractal Brownian Motion (octaves)
  public fbm2D(
    x: number,
    y: number,
    octaves: number = 4,
    lacunarity: number = 2.0,
    gain: number = 0.5
  ): number {
    let sum = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
      sum += this.noise2D(x * frequency, y * frequency) * amplitude;
      max += amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }

    return sum / max;
  }
}
