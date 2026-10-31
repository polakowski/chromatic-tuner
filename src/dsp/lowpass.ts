/**
 * Cascaded Butterworth low-pass built from RBJ cookbook biquads.
 *
 * Używany jako filtr antyaliasingowy przed decymacją. Stan jest trzymany
 * pomiędzy wywołaniami, więc strumień można filtrować porcjami bez
 * nieciągłości na granicach buforów.
 */
interface BiquadStage {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

function makeStage(cutoffHz: number, sampleRate: number, q: number): BiquadStage {
  const w0 = (2 * Math.PI * cutoffHz) / sampleRate;
  const cosW0 = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);

  const b0 = (1 - cosW0) / 2;
  const b1 = 1 - cosW0;
  const b2 = (1 - cosW0) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
  };
}

/** Q values for a Butterworth cascade of `2 * stages` order. */
function butterworthQs(stages: number): number[] {
  const order = stages * 2;
  const qs: number[] = [];
  for (let k = 0; k < stages; k++) {
    const pole = (Math.PI * (2 * k + 1)) / (2 * order);
    qs.push(1 / (2 * Math.cos(pole)));
  }
  return qs;
}

export class LowPassFilter {
  private readonly stages: BiquadStage[];

  constructor(cutoffHz: number, sampleRate: number, stageCount = 2) {
    const nyquist = sampleRate / 2;
    const cutoff = Math.min(cutoffHz, nyquist * 0.98);
    this.stages = butterworthQs(stageCount).map((q) => makeStage(cutoff, sampleRate, q));
  }

  /** Filters `input` into `output` (may be the same array). */
  process(input: Float32Array, output: Float32Array, length = input.length): void {
    const { stages } = this;
    for (let i = 0; i < length; i++) {
      let sample = input[i];
      for (let s = 0; s < stages.length; s++) {
        const stage = stages[s];
        const y =
          stage.b0 * sample +
          stage.b1 * stage.x1 +
          stage.b2 * stage.x2 -
          stage.a1 * stage.y1 -
          stage.a2 * stage.y2;
        stage.x2 = stage.x1;
        stage.x1 = sample;
        stage.y2 = stage.y1;
        stage.y1 = y;
        sample = y;
      }
      output[i] = sample;
    }
  }

  reset(): void {
    for (const stage of this.stages) {
      stage.x1 = 0;
      stage.x2 = 0;
      stage.y1 = 0;
      stage.y2 = 0;
    }
  }
}
