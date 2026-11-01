import {
  advancePhase,
  BAND_MULTIPLIERS,
  PERIODS_PER_SECOND_AT_FULL_SCALE,
  phaseRate,
} from '../strobePhase';

describe('phaseRate', () => {
  it('is still when the note is in tune', () => {
    expect(phaseRate(0)).toBe(0);
  });

  it('reaches full scale speed at 50 cents', () => {
    expect(phaseRate(50)).toBeCloseTo(PERIODS_PER_SECOND_AT_FULL_SCALE, 6);
  });

  it('reverses direction for a flat note', () => {
    expect(phaseRate(-20)).toBeCloseTo(-phaseRate(20), 6);
  });

  it('scales linearly with the deviation', () => {
    expect(phaseRate(10)).toBeCloseTo(phaseRate(5) * 2, 6);
  });
});

describe('advancePhase', () => {
  it('holds the pattern still when in tune', () => {
    expect(advancePhase(0.42, 0, 1)).toBeCloseTo(0.42, 6);
  });

  it('advances forward when sharp', () => {
    // +50 centów to 4 okresy na sekundę, więc ćwierć sekundy to dokładnie jeden okres.
    expect(advancePhase(0, 50, 0.25)).toBeCloseTo(0, 6);
    expect(advancePhase(0, 50, 0.125)).toBeCloseTo(0.5, 6);
  });

  it('advances backward when flat', () => {
    expect(advancePhase(0.75, -50, 0.125)).toBeCloseTo(0.25, 6);
  });

  it('always wraps into [0, 1)', () => {
    let phase = 0;
    for (const cents of [37, -48, 12, -3, 50, -50]) {
      for (let step = 0; step < 50; step++) {
        phase = advancePhase(phase, cents, 1 / 60);
        expect(phase).toBeGreaterThanOrEqual(0);
        expect(phase).toBeLessThan(1);
      }
    }
  });

  it('wraps a negative drift without going below zero', () => {
    expect(advancePhase(0.01, -50, 0.125)).toBeCloseTo(0.51, 6);
  });

  it('keeps bands in harmonic ratios', () => {
    expect([...BAND_MULTIPLIERS]).toEqual([1, 2, 4]);
  });
});
