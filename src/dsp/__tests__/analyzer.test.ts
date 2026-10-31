import { AnalysisResult, PitchAnalyzer } from '../analyzer';
import { centsBetween, generateTone, pushInChunks } from '../../testing/signals';

const SAMPLE_RATE = 44100;
const CHUNK = 1024;

function detect(signal: Float32Array, sampleRate = SAMPLE_RATE): AnalysisResult[] {
  const analyzer = new PitchAnalyzer({ sampleRate });
  return pushInChunks(signal, CHUNK, (chunk) => analyzer.push(chunk));
}

/** Median of the last few detections — pierwsze ramki są niepełne. */
function stableFrequency(results: AnalysisResult[]): number {
  const values = results
    .map((r) => r.frequency)
    .filter((f): f is number => f !== null)
    .slice(-8);
  expect(values.length).toBeGreaterThan(0);
  return values.sort((a, b) => a - b)[values.length >> 1];
}

describe('PitchAnalyzer', () => {
  const cases: { label: string; frequency: number }[] = [
    { label: 'B0 (low 5-string bass)', frequency: 30.87 },
    { label: 'E1 (bass low E)', frequency: 41.2 },
    { label: 'E2 (guitar low E)', frequency: 82.41 },
    { label: 'A2', frequency: 110 },
    { label: 'A4', frequency: 440 },
    { label: 'A5', frequency: 880 },
    { label: 'E6', frequency: 1318.51 },
  ];

  it.each(cases)('tracks a pure $label within 1 cent', ({ frequency }) => {
    const signal = generateTone({ frequency, sampleRate: SAMPLE_RATE, durationSeconds: 0.6 });
    const detected = stableFrequency(detect(signal));
    expect(Math.abs(centsBetween(detected, frequency))).toBeLessThan(1);
  });

  it.each(cases.slice(1))('tracks a harmonic-rich $label within 2 cents', ({ frequency }) => {
    const signal = generateTone({
      frequency,
      sampleRate: SAMPLE_RATE,
      durationSeconds: 0.6,
      harmonics: [1, 0.6, 0.4, 0.25, 0.15],
      noiseLevel: 0.002,
    });
    const detected = stableFrequency(detect(signal));
    expect(Math.abs(centsBetween(detected, frequency))).toBeLessThan(2);
  });

  it('does not report an octave error for a signal with a weak fundamental', () => {
    const signal = generateTone({
      frequency: 196,
      sampleRate: SAMPLE_RATE,
      durationSeconds: 0.6,
      harmonics: [0.2, 1, 0.8, 0.5],
    });
    const detected = stableFrequency(detect(signal));
    expect(Math.abs(centsBetween(detected, 196))).toBeLessThan(5);
  });

  it('reports silence as no pitch', () => {
    const signal = new Float32Array(SAMPLE_RATE * 0.3);
    const results = detect(signal);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.frequency === null)).toBe(true);
  });

  it('rejects quiet noise', () => {
    const signal = generateTone({
      frequency: 440,
      sampleRate: SAMPLE_RATE,
      durationSeconds: 0.4,
      amplitude: 0,
      noiseLevel: 0.001,
    });
    const results = detect(signal);
    expect(results.every((r) => r.frequency === null)).toBe(true);
  });

  it('works at a 48 kHz hardware rate', () => {
    const signal = generateTone({ frequency: 329.63, sampleRate: 48000, durationSeconds: 0.6 });
    const detected = stableFrequency(detect(signal, 48000));
    expect(Math.abs(centsBetween(detected, 329.63))).toBeLessThan(2);
  });

  it('only returns a result on hop boundaries', () => {
    const analyzer = new PitchAnalyzer({ sampleRate: SAMPLE_RATE });
    const chunk = new Float32Array(256);

    // Priming: dopóki ramka nie jest pełna, nie ma czego analizować.
    for (let i = 0; i < analyzer.frameSize / chunk.length; i++) {
      analyzer.push(chunk);
    }

    const hopChunks = analyzer.hopSize / chunk.length;
    for (let i = 0; i < hopChunks - 1; i++) {
      expect(analyzer.push(chunk)).toBeNull();
    }
    expect(analyzer.push(chunk)).not.toBeNull();
  });
});
