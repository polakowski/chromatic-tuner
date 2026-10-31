export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** MIDI note number of A4, the reference pitch. */
export const A4_MIDI = 69;

export type Accidental = 'sharp' | 'flat';

export interface NoteName {
  /** Letter plus accidental, e.g. "F#" or "Gb". */
  name: string;
  /** Letter only, e.g. "F". */
  letter: string;
  /** "#", "b" or "" — rendered separately so the letter can stay large. */
  accidental: string;
  /** Scientific pitch notation octave (A4 = 440 Hz by default). */
  octave: number;
}

export function describeNote(midi: number, accidental: Accidental = 'sharp'): NoteName {
  const pitchClass = ((midi % 12) + 12) % 12;
  const name = accidental === 'flat' ? FLAT_NAMES[pitchClass] : SHARP_NAMES[pitchClass];
  return {
    name,
    letter: name[0],
    accidental: name.slice(1),
    octave: Math.floor(midi / 12) - 1,
  };
}

/** Frequency of a MIDI note for the given A4 reference. */
export function midiToFrequency(midi: number, referenceA: number): number {
  return referenceA * Math.pow(2, (midi - A4_MIDI) / 12);
}
