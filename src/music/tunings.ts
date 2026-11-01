import { describeNote, type Accidental, type NoteName } from './notes';

/**
 * Stroje instrumentów. Struny trzymamy jako numery MIDI od najniższej,
 * niezależnie od stroju A — przeliczenie na herce robi `midiToFrequency`,
 * więc zmiana referencji przesuwa cały instrument razem ze skalą.
 */
export interface Tuning {
  id: string;
  name: string;
  instrument: 'guitar' | 'bass';
  /** MIDI note numbers, lowest string first. */
  strings: number[];
}

/** Tryb chromatyczny nie ma strun — odchyłka liczy się do najbliższego półtonu. */
export const CHROMATIC_ID = 'chromatic';

export const TUNINGS: Tuning[] = [
  { id: 'guitar-standard', name: 'Guitar standard', instrument: 'guitar', strings: [40, 45, 50, 55, 59, 64] },
  { id: 'guitar-drop-d', name: 'Drop D', instrument: 'guitar', strings: [38, 45, 50, 55, 59, 64] },
  { id: 'guitar-eb', name: 'E♭ standard', instrument: 'guitar', strings: [39, 44, 49, 54, 58, 63] },
  { id: 'guitar-d', name: 'D standard', instrument: 'guitar', strings: [38, 43, 48, 53, 57, 62] },
  { id: 'guitar-seven', name: '7-string', instrument: 'guitar', strings: [35, 40, 45, 50, 55, 59, 64] },
  { id: 'guitar-open-em', name: 'Open Em', instrument: 'guitar', strings: [40, 47, 52, 55, 59, 64] },
  { id: 'guitar-open-g', name: 'Open G', instrument: 'guitar', strings: [38, 43, 50, 55, 59, 62] },
  { id: 'bass-four', name: 'Bass 4-string', instrument: 'bass', strings: [28, 33, 38, 43] },
  { id: 'bass-five', name: 'Bass 5-string', instrument: 'bass', strings: [23, 28, 33, 38, 43] },
];

/** Returns the tuning with this id, or null for chromatic mode / an unknown id. */
export function findTuning(id: string): Tuning | null {
  if (id === CHROMATIC_ID) {
    return null;
  }
  return TUNINGS.find((tuning) => tuning.id === id) ?? null;
}

/**
 * Index of the string closest to a fractional MIDI value.
 *
 * Porównujemy w półtonach, a nie w hercach, bo w hercach odległości między
 * strunami są nierówne i najbliższa struna wychodziłaby inna dla basu niż
 * dla gitary.
 */
export function nearestStringIndex(strings: number[], exactMidi: number): number {
  let best = 0;
  let bestDistance = Math.abs(strings[0] - exactMidi);
  for (let i = 1; i < strings.length; i++) {
    const distance = Math.abs(strings[i] - exactMidi);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Names of a tuning's strings, lowest first, honouring the ♯/♭ preference.
 * Powtórzone nuty (np. trzy E w Open Em) zostają — numer oktawy je rozróżnia.
 */
export function describeStrings(tuning: Tuning, accidental: Accidental): NoteName[] {
  return tuning.strings.map((midi) => describeNote(midi, accidental));
}

export interface TuningTarget {
  /** MIDI note the deviation is measured against. */
  midi: number;
  /** Deviation from that note, in cents. */
  cents: number;
  /** Matched string, or null in chromatic mode. */
  stringIndex: number | null;
}

/**
 * Decides what the played pitch is being compared against.
 *
 * W trybie chromatycznym to najbliższy półton. W trybie instrumentu —
 * najbliższa struna stroju, dzięki czemu mocno opuszczone E pokazuje się
 * jako „E, bardzo nisko", a nie jako sąsiedni półton. Przypięta struna
 * wygrywa z automatem, bo przy skrajnym rozstrojeniu automat wybrałby sąsiada.
 */
export function resolveTarget(
  exactMidi: number,
  tuning: Tuning | null,
  lockedString: number | null
): TuningTarget {
  if (!tuning) {
    const midi = Math.round(exactMidi);
    return { midi, cents: (exactMidi - midi) * 100, stringIndex: null };
  }

  const locked =
    lockedString !== null && lockedString >= 0 && lockedString < tuning.strings.length
      ? lockedString
      : null;
  const stringIndex = locked ?? nearestStringIndex(tuning.strings, exactMidi);
  const midi = tuning.strings[stringIndex];

  return { midi, cents: (exactMidi - midi) * 100, stringIndex };
}
