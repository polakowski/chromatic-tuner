/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002).
 *
 * Dwa etapy:
 *  1. `YinDetector` — zgrubna estymacja okresu na zdecymowanym sygnale (tanio).
 *  2. `refinePeriod` — doprecyzowanie na pełnej częstotliwości próbkowania
 *     w wąskim oknie wokół zgrubnego wyniku (dokładność << 1 centa).
 */

export interface YinConfig {
  sampleRate: number;
  frameSize: number;
  minFrequency: number;
  maxFrequency: number;
  /** CMNDF value below which a dip is accepted outright. */
  threshold: number;
  /** CMNDF value below which the global minimum is accepted as a fallback. */
  fallbackThreshold: number;
}

export interface PeriodEstimate {
  /** Period in samples (fractional). */
  period: number;
  /** CMNDF value at the chosen dip — lower means a more periodic signal. */
  clarity: number;
}

/**
 * Parabolic interpolation of the minimum around integer index `i`.
 * Zwraca przesunięcie ułamkowe w zakresie (-1, 1).
 */
function parabolicOffset(values: Float32Array, i: number, lastIndex: number): number {
  if (i <= 0 || i >= lastIndex) {
    return 0;
  }
  const prev = values[i - 1];
  const curr = values[i];
  const next = values[i + 1];
  const denominator = 2 * (2 * curr - prev - next);
  if (denominator === 0) {
    return 0;
  }
  const offset = (next - prev) / denominator;
  return Math.abs(offset) < 1 ? offset : 0;
}

export class YinDetector {
  private readonly difference: Float32Array;
  private readonly cmndf: Float32Array;
  private readonly tauMin: number;
  private readonly tauMax: number;
  /** Analysis window length used by the difference function. */
  private readonly windowSize: number;

  constructor(private readonly config: YinConfig) {
    const { sampleRate, frameSize, minFrequency, maxFrequency } = config;

    this.tauMin = Math.max(2, Math.floor(sampleRate / maxFrequency));
    this.tauMax = Math.min(Math.ceil(sampleRate / minFrequency), frameSize - 2);
    this.windowSize = frameSize - this.tauMax;

    if (this.windowSize < 2 * this.tauMin || this.tauMax <= this.tauMin) {
      throw new Error(
        `YinDetector: frameSize ${frameSize} is too small for ${minFrequency}-${maxFrequency} Hz at ${sampleRate} Hz`
      );
    }

    this.difference = new Float32Array(this.tauMax + 1);
    this.cmndf = new Float32Array(this.tauMax + 1);
  }

  /** Lowest/highest period (in samples) this detector will report. */
  get periodRange(): [number, number] {
    return [this.tauMin, this.tauMax];
  }

  estimate(frame: Float32Array): PeriodEstimate | null {
    const { difference, cmndf, tauMin, tauMax, windowSize } = this;

    difference[0] = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const delta = frame[j] - frame[j + tau];
        sum += delta * delta;
      }
      difference[tau] = sum;
    }

    // Cumulative mean normalized difference function.
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= tauMax; tau++) {
      runningSum += difference[tau];
      cmndf[tau] = runningSum > 0 ? (difference[tau] * tau) / runningSum : 1;
    }

    const { threshold, fallbackThreshold } = this.config;

    // Pierwszy dip poniżej progu — dzięki temu nie łapiemy wielokrotności okresu.
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmndf[tau] >= threshold) {
        continue;
      }
      let best = tau;
      while (best + 1 <= tauMax && cmndf[best + 1] < cmndf[best]) {
        best++;
      }
      return {
        period: best + parabolicOffset(cmndf, best, tauMax),
        clarity: cmndf[best],
      };
    }

    let globalBest = tauMin;
    for (let tau = tauMin + 1; tau <= tauMax; tau++) {
      if (cmndf[tau] < cmndf[globalBest]) {
        globalBest = tau;
      }
    }
    if (cmndf[globalBest] >= fallbackThreshold) {
      return null;
    }
    return {
      period: globalBest + parabolicOffset(cmndf, globalBest, tauMax),
      clarity: cmndf[globalBest],
    };
  }
}

const REFINE_SCRATCH_SIZE = 16;
const refineScratch = new Float32Array(REFINE_SCRATCH_SIZE);

/**
 * Refines a period estimate on the full-rate frame by minimizing the plain
 * difference function in a narrow band around `periodGuess`.
 *
 * Zwraca `periodGuess`, jeśli ramka jest za krótka na doprecyzowanie.
 */
export function refinePeriod(frame: Float32Array, periodGuess: number, searchRadius = 3): number {
  const center = Math.round(periodGuess);
  const tauLo = Math.max(2, center - searchRadius - 1);
  const tauHi = center + searchRadius + 1;
  const count = tauHi - tauLo + 1;

  const windowSize = frame.length - tauHi;
  if (windowSize < 32 || count > REFINE_SCRATCH_SIZE) {
    return periodGuess;
  }

  for (let i = 0; i < count; i++) {
    const tau = tauLo + i;
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      const delta = frame[j] - frame[j + tau];
      sum += delta * delta;
    }
    refineScratch[i] = sum;
  }

  let bestIndex = 0;
  for (let i = 1; i < count; i++) {
    if (refineScratch[i] < refineScratch[bestIndex]) {
      bestIndex = i;
    }
  }

  // Minimum na brzegu okna oznacza, że zgrubny wynik był poza zakresem szukania.
  if (bestIndex === 0 || bestIndex === count - 1) {
    return periodGuess;
  }

  return tauLo + bestIndex + parabolicOffset(refineScratch, bestIndex, count - 1);
}
