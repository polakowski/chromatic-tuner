/** Generators used by the DSP tests. */

export interface ToneOptions {
  frequency: number;
  sampleRate: number;
  durationSeconds: number;
  /** Relative amplitudes of harmonics 1..n. */
  harmonics?: number[];
  amplitude?: number;
  noiseLevel?: number;
  seed?: number;
}

/** Deterministic pseudo-random noise so tests stay reproducible. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTone({
  frequency,
  sampleRate,
  durationSeconds,
  harmonics = [1],
  amplitude = 0.3,
  noiseLevel = 0,
  seed = 1,
}: ToneOptions): Float32Array {
  const length = Math.floor(sampleRate * durationSeconds);
  const out = new Float32Array(length);
  const random = mulberry32(seed);
  const norm = harmonics.reduce((sum, h) => sum + Math.abs(h), 0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (let h = 0; h < harmonics.length; h++) {
      sample += harmonics[h] * Math.sin(2 * Math.PI * frequency * (h + 1) * t);
    }
    sample = (sample / norm) * amplitude;
    if (noiseLevel > 0) {
      sample += (random() * 2 - 1) * noiseLevel;
    }
    out[i] = sample;
  }
  return out;
}

/** Feeds a signal through the analyzer in chunks and returns every result. */
export function pushInChunks<T>(
  signal: Float32Array,
  chunkSize: number,
  push: (chunk: Float32Array) => T | null
): T[] {
  const results: T[] = [];
  for (let offset = 0; offset < signal.length; offset += chunkSize) {
    const chunk = signal.subarray(offset, Math.min(offset + chunkSize, signal.length));
    const result = push(chunk as Float32Array);
    if (result !== null) {
      results.push(result);
    }
  }
  return results;
}

export function centsBetween(a: number, b: number): number {
  return 1200 * Math.log2(a / b);
}
