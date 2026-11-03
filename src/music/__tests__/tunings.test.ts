import { midiToFrequency } from '../notes';
import {
  CHROMATIC_ID,
  describeStrings,
  findTuning,
  nearestStringIndex,
  resolveTarget,
  TUNINGS,
} from '../tunings';

function namesOf(id: string): string[] {
  const tuning = findTuning(id);
  if (!tuning) {
    throw new Error(`unknown tuning ${id}`);
  }
  return describeStrings(tuning, 'sharp').map((note) => `${note.name}${note.octave}`);
}

describe('TUNINGS', () => {
  it('has unique ids', () => {
    const ids = TUNINGS.map((tuning) => tuning.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists strings from lowest to highest', () => {
    for (const tuning of TUNINGS) {
      const sorted = [...tuning.strings].sort((a, b) => a - b);
      expect(tuning.strings).toEqual(sorted);
    }
  });

  it('stays inside the range the analyzer can detect', () => {
    for (const tuning of TUNINGS) {
      for (const midi of tuning.strings) {
        const hz = midiToFrequency(midi, 440);
        expect(hz).toBeGreaterThan(27);
        expect(hz).toBeLessThan(2000);
      }
    }
  });

  it('names guitar tunings correctly', () => {
    expect(namesOf('guitar-standard')).toEqual(['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
    expect(namesOf('guitar-drop-d')).toEqual(['D2', 'A2', 'D3', 'G3', 'B3', 'E4']);
    expect(namesOf('guitar-d')).toEqual(['D2', 'G2', 'C3', 'F3', 'A3', 'D4']);
    expect(namesOf('guitar-seven')).toEqual(['B1', 'E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
    expect(namesOf('guitar-open-em')).toEqual(['E2', 'B2', 'E3', 'G3', 'B3', 'E4']);
    expect(namesOf('guitar-open-g')).toEqual(['D2', 'G2', 'D3', 'G3', 'B3', 'D4']);
  });

  it('names the E flat tuning as flats when asked', () => {
    const tuning = findTuning('guitar-eb');
    expect(tuning).not.toBeNull();
    expect(describeStrings(tuning!, 'flat').map((note) => `${note.name}${note.octave}`)).toEqual([
      'Eb2',
      'Ab2',
      'Db3',
      'Gb3',
      'Bb3',
      'Eb4',
    ]);
  });

  it('names bass tunings correctly', () => {
    expect(namesOf('bass-four')).toEqual(['E1', 'A1', 'D2', 'G2']);
    expect(namesOf('bass-five')).toEqual(['B0', 'E1', 'A1', 'D2', 'G2']);
  });

  it('puts the guitar low E at 82.41 Hz and the 5-string bass B at 30.87 Hz', () => {
    expect(midiToFrequency(findTuning('guitar-standard')!.strings[0], 440)).toBeCloseTo(82.41, 2);
    expect(midiToFrequency(findTuning('bass-five')!.strings[0], 440)).toBeCloseTo(30.87, 2);
  });
});

describe('findTuning', () => {
  it('returns null for chromatic mode', () => {
    expect(findTuning(CHROMATIC_ID)).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(findTuning('banjo-of-doom')).toBeNull();
  });
});

describe('nearestStringIndex', () => {
  const guitar = [40, 45, 50, 55, 59, 64];

  it('matches an exactly in-tune string', () => {
    guitar.forEach((midi, index) => {
      expect(nearestStringIndex(guitar, midi)).toBe(index);
    });
  });

  it('still picks the right string when badly out of tune', () => {
    // Niskie E zjechane o 80 centów nadal jest najbliżej E, nie D#.
    expect(nearestStringIndex(guitar, 40 - 0.8)).toBe(0);
    expect(nearestStringIndex(guitar, 64 + 0.9)).toBe(5);
  });

  it('resolves a value between two strings to the closer one', () => {
    expect(nearestStringIndex(guitar, 42)).toBe(0);
    expect(nearestStringIndex(guitar, 43)).toBe(1);
  });

  it('prefers the lower string on an exact tie', () => {
    // 42.5 leży dokładnie w połowie między 40 a 45.
    expect(nearestStringIndex(guitar, 42.5)).toBe(0);
  });

  it('handles tunings with repeated notes an octave apart', () => {
    const openEm = [40, 47, 52, 55, 59, 64];
    expect(nearestStringIndex(openEm, 52.1)).toBe(2);
    expect(nearestStringIndex(openEm, 63.8)).toBe(5);
  });
});

describe('resolveTarget', () => {
  const guitar = findTuning('guitar-standard')!;

  it('falls back to the nearest semitone in chromatic mode', () => {
    const target = resolveTarget(69.2, null, null);
    expect(target).toEqual({ midi: 69, cents: expect.closeTo(20, 6), stringIndex: null });
  });

  it('measures against the nearest string in instrument mode', () => {
    // A2 (45) zjechane o 30 centów.
    const target = resolveTarget(44.7, guitar, null);
    expect(target.stringIndex).toBe(1);
    expect(target.midi).toBe(45);
    expect(target.cents).toBeCloseTo(-30, 6);
  });

  it('reports a badly flat low E against E, not against the neighbouring semitone', () => {
    const target = resolveTarget(39.3, guitar, null);
    expect(target.midi).toBe(40);
    expect(target.cents).toBeCloseTo(-70, 6);
  });

  it('honours a pinned string even when another one is closer', () => {
    // Gramy blisko D3 (50), ale użytkownik przypiął niskie E (indeks 0).
    const target = resolveTarget(49.9, guitar, 0);
    expect(target.stringIndex).toBe(0);
    expect(target.midi).toBe(40);
    expect(target.cents).toBeCloseTo(990, 6);
  });

  it('ignores a pin that is out of range for the tuning', () => {
    const target = resolveTarget(44.7, guitar, 11);
    expect(target.stringIndex).toBe(1);
  });

  it('ignores a pin in chromatic mode', () => {
    expect(resolveTarget(69.2, null, 3).stringIndex).toBeNull();
  });
});
