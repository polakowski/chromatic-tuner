/**
 * Wygładzanie odczytów f0: mediana (zabija pojedyncze przeskoki oktawowe
 * i gubione ramki) + EMA w skali logarytmicznej (równomierna w centach).
 * Przy zmianie nuty EMA jest "przyklejana" do nowej wartości, żeby wskaźnik
 * nie przejeżdżał leniwie przez nuty pośrednie.
 */
export interface SmootherOptions {
  /** Odd window length for the median filter. */
  medianSize?: number;
  /** EMA weight for each new reading (0..1); higher reacts faster. */
  emaAlpha?: number;
  /** How long the last reading is kept after the signal drops, in ms. */
  holdMs?: number;
  /** Jumps larger than this (in semitones) snap instead of being smoothed. */
  snapSemitones?: number;
}

const DEFAULTS = {
  medianSize: 5,
  emaAlpha: 0.35,
  holdMs: 600,
  snapSemitones: 0.75,
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[sorted.length >> 1];
}

export class PitchSmoother {
  private readonly options: Required<SmootherOptions>;
  private history: number[] = [];
  private smoothedLog: number | null = null;
  private lastValidAt = 0;

  constructor(options: SmootherOptions = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  /**
   * Feeds one raw reading (null when silent) and returns the smoothed
   * frequency, or null when nothing should be displayed.
   */
  update(frequency: number | null, now: number): number | null {
    const { medianSize, emaAlpha, holdMs, snapSemitones } = this.options;

    if (frequency === null || !Number.isFinite(frequency) || frequency <= 0) {
      if (this.smoothedLog !== null && now - this.lastValidAt <= holdMs) {
        return Math.pow(2, this.smoothedLog);
      }
      this.reset();
      return null;
    }

    this.history.push(Math.log2(frequency));
    if (this.history.length > medianSize) {
      this.history.shift();
    }

    const target = median(this.history);
    if (this.smoothedLog === null || Math.abs(target - this.smoothedLog) * 12 > snapSemitones) {
      this.smoothedLog = target;
      this.history = [target];
    } else {
      this.smoothedLog += (target - this.smoothedLog) * emaAlpha;
    }

    this.lastValidAt = now;
    return Math.pow(2, this.smoothedLog);
  }

  reset(): void {
    this.history = [];
    this.smoothedLog = null;
    this.lastValidAt = 0;
  }
}
