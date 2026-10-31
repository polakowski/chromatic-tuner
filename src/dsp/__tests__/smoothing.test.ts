import { PitchSmoother } from '../smoothing';

describe('PitchSmoother', () => {
  it('converges on a steady reading', () => {
    const smoother = new PitchSmoother();
    let value: number | null = null;
    for (let i = 0; i < 30; i++) {
      value = smoother.update(440, i * 23);
    }
    expect(value).toBeCloseTo(440, 3);
  });

  it('ignores a single octave glitch', () => {
    const smoother = new PitchSmoother();
    for (let i = 0; i < 10; i++) {
      smoother.update(220, i * 23);
    }
    const value = smoother.update(110, 11 * 23);
    expect(value).toBeCloseTo(220, 1);
  });

  it('snaps to a new note once the median has moved, instead of gliding', () => {
    const smoother = new PitchSmoother();
    for (let i = 0; i < 10; i++) {
      smoother.update(220, i * 23);
    }

    // Mediana potrzebuje kilku ramek, ale potem przeskok jest natychmiastowy.
    expect(smoother.update(330, 11 * 23)).toBeCloseTo(220, 1);
    smoother.update(330, 12 * 23);
    expect(smoother.update(330, 13 * 23)).toBeCloseTo(330, 3);
  });

  it('holds the last value briefly after the signal drops', () => {
    const smoother = new PitchSmoother({ holdMs: 500 });
    for (let i = 0; i < 10; i++) {
      smoother.update(440, i * 23);
    }
    expect(smoother.update(null, 10 * 23 + 100)).toBeCloseTo(440, 1);
    expect(smoother.update(null, 10 * 23 + 900)).toBeNull();
  });

  it('starts clean after a reset', () => {
    const smoother = new PitchSmoother();
    smoother.update(440, 0);
    smoother.reset();
    expect(smoother.update(null, 10)).toBeNull();
  });
});
