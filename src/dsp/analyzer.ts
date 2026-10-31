import { LowPassFilter } from './lowpass';
import { RingBuffer } from './ringBuffer';
import { refinePeriod, YinDetector } from './yin';

/**
 * Łączy cały łańcuch DSP: strumień PCM -> filtr antyaliasingowy -> decymacja
 * -> zgrubny YIN -> doprecyzowanie na pełnej częstotliwości -> f0 w Hz.
 *
 * Czysty TypeScript, bez zależności od React Native — testowalny samodzielnie.
 */

export interface AnalyzerOptions {
  sampleRate: number;
  /** Lowest detectable frequency in Hz. */
  minFrequency?: number;
  /** Highest detectable frequency in Hz. */
  maxFrequency?: number;
  /** Analysis window at full rate, in samples. Must be a power of two. */
  frameSize?: number;
  /** Samples between consecutive analyses at full rate. */
  hopSize?: number;
  /** Signals quieter than this RMS are treated as silence. */
  rmsThreshold?: number;
}

export interface AnalysisResult {
  /** Detected fundamental in Hz, or null when no stable pitch was found. */
  frequency: number | null;
  /** 0..1, where 0 means perfectly periodic. */
  clarity: number;
  rms: number;
}

const DEFAULT_MIN_FREQUENCY = 30;
const DEFAULT_MAX_FREQUENCY = 2000;
const DEFAULT_FRAME_SIZE = 4096;
const DEFAULT_RMS_THRESHOLD = 0.004;
/** Decimation aims for roughly this rate — cheap YIN, still 5x the top note. */
const TARGET_DECIMATED_RATE = 11025;

export class PitchAnalyzer {
  readonly sampleRate: number;
  readonly frameSize: number;
  readonly hopSize: number;
  readonly decimationFactor: number;

  private readonly minFrequency: number;
  private readonly maxFrequency: number;
  private readonly lowpass: LowPassFilter;
  private readonly fullBuffer: RingBuffer;
  private readonly decimatedBuffer: RingBuffer;
  private readonly fullFrame: Float32Array;
  private readonly decimatedFrame: Float32Array;
  private readonly detector: YinDetector;

  private filterScratch = new Float32Array(0);
  private decimateScratch = new Float32Array(0);
  private decimationPhase = 0;
  private hopCounter = 0;
  private rmsThreshold: number;

  constructor(options: AnalyzerOptions) {
    const {
      sampleRate,
      minFrequency = DEFAULT_MIN_FREQUENCY,
      maxFrequency = DEFAULT_MAX_FREQUENCY,
      frameSize = DEFAULT_FRAME_SIZE,
      hopSize = frameSize / 4,
      rmsThreshold = DEFAULT_RMS_THRESHOLD,
    } = options;

    this.sampleRate = sampleRate;
    this.minFrequency = minFrequency;
    this.maxFrequency = maxFrequency;
    this.frameSize = frameSize;
    this.hopSize = hopSize;
    this.rmsThreshold = rmsThreshold;

    this.decimationFactor = Math.min(8, Math.max(1, Math.round(sampleRate / TARGET_DECIMATED_RATE)));
    const decimatedRate = sampleRate / this.decimationFactor;
    const decimatedFrameSize = Math.floor(frameSize / this.decimationFactor);

    this.lowpass = new LowPassFilter(Math.min(decimatedRate * 0.4, 4500), sampleRate);
    this.fullBuffer = new RingBuffer(frameSize);
    this.decimatedBuffer = new RingBuffer(decimatedFrameSize);
    this.fullFrame = new Float32Array(frameSize);
    this.decimatedFrame = new Float32Array(decimatedFrameSize);

    this.detector = new YinDetector({
      sampleRate: decimatedRate,
      frameSize: decimatedFrameSize,
      minFrequency,
      maxFrequency,
      threshold: 0.15,
      fallbackThreshold: 0.45,
    });
  }

  setRmsThreshold(value: number): void {
    this.rmsThreshold = value;
  }

  /**
   * Feeds mono samples into the analyzer. Returns a result only on hop
   * boundaries (roughly `sampleRate / hopSize` times per second), null otherwise.
   */
  push(samples: Float32Array, length = samples.length): AnalysisResult | null {
    if (this.filterScratch.length < length) {
      this.filterScratch = new Float32Array(length);
      this.decimateScratch = new Float32Array(length);
    }

    const filtered = this.filterScratch;
    this.lowpass.process(samples, filtered, length);

    const { decimationFactor } = this;
    const decimated = this.decimateScratch;
    let decimatedCount = 0;
    for (let i = 0; i < length; i++) {
      if (this.decimationPhase === 0) {
        decimated[decimatedCount++] = filtered[i];
      }
      this.decimationPhase = this.decimationPhase + 1 === decimationFactor ? 0 : this.decimationPhase + 1;
    }

    this.fullBuffer.write(samples, length);
    this.decimatedBuffer.write(decimated, decimatedCount);

    this.hopCounter += length;
    if (this.hopCounter < this.hopSize) {
      return null;
    }
    this.hopCounter %= this.hopSize;

    return this.analyze();
  }

  reset(): void {
    this.lowpass.reset();
    this.fullBuffer.reset();
    this.decimatedBuffer.reset();
    this.decimationPhase = 0;
    this.hopCounter = 0;
  }

  private analyze(): AnalysisResult | null {
    if (!this.fullBuffer.readLatest(this.fullFrame)) {
      return null;
    }
    if (!this.decimatedBuffer.readLatest(this.decimatedFrame)) {
      return null;
    }

    let energy = 0;
    for (let i = 0; i < this.fullFrame.length; i++) {
      energy += this.fullFrame[i] * this.fullFrame[i];
    }
    const rms = Math.sqrt(energy / this.fullFrame.length);

    if (rms < this.rmsThreshold) {
      return { frequency: null, clarity: 1, rms };
    }

    const coarse = this.detector.estimate(this.decimatedFrame);
    if (!coarse) {
      return { frequency: null, clarity: 1, rms };
    }

    const period = refinePeriod(this.fullFrame, coarse.period * this.decimationFactor);
    const frequency = this.sampleRate / period;

    if (frequency < this.minFrequency * 0.95 || frequency > this.maxFrequency * 1.05) {
      return { frequency: null, clarity: coarse.clarity, rms };
    }

    return { frequency, clarity: coarse.clarity, rms };
  }
}
