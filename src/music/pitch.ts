import { A4_MIDI } from './notes';

export interface PitchReading {
  /** Fractional MIDI note number — integer part is the note, fraction the detuning. */
  exactMidi: number;
  /** Nearest MIDI note number. */
  midi: number;
  /** Deviation from the nearest note, in cents (-50..+50). */
  cents: number;
}

/**
 * Konwersja częstotliwości na nutę względem zadanego stroju A4.
 * Liczona w skali logarytmicznej, więc działa dla dowolnego A (nie tylko 440 Hz).
 */
export function frequencyToPitch(frequency: number, referenceA: number): PitchReading {
  const exactMidi = A4_MIDI + 12 * Math.log2(frequency / referenceA);
  const midi = Math.round(exactMidi);
  return {
    exactMidi,
    midi,
    cents: (exactMidi - midi) * 100,
  };
}

/** Inverse of {@link frequencyToPitch} for a fractional MIDI value. */
export function pitchToFrequency(exactMidi: number, referenceA: number): number {
  return referenceA * Math.pow(2, (exactMidi - A4_MIDI) / 12);
}
