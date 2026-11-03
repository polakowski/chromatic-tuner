import { create } from 'zustand';

/**
 * Pomiary menzury jednej struny. Trzymamy odczyty w centach, a nie gotowy
 * werdykt, bo zmiana typu mostka ma od razu przeliczyć kierunek kręcenia
 * bez proszenia o ponowne zagranie.
 */
export interface StringMeasurement {
  /** Deviation of the open string when it was captured, in cents. */
  openCents: number;
  /** Deviation of the 12th fret note, or null before it is captured. */
  frettedCents: number | null;
}

interface IntonationState {
  /** String being worked on, or null when none is selected. */
  activeString: number | null;
  measurements: Record<number, StringMeasurement>;
  selectString: (index: number) => void;
  captureOpen: (cents: number) => void;
  captureFretted: (cents: number) => void;
  resetString: (index: number) => void;
  resetAll: () => void;
}

/**
 * Celowo bez `persist` — pomiar opisuje stan instrumentu w tej chwili.
 * Odczyt z poprzedniej sesji po przekręceniu śruby wprowadzałby w błąd.
 */
export const useIntonation = create<IntonationState>()((set, get) => ({
  activeString: null,
  measurements: {},
  selectString: (index) => set({ activeString: index }),
  captureOpen: (cents) => {
    const index = get().activeString;
    if (index === null) {
      return;
    }
    set((state) => ({
      measurements: { ...state.measurements, [index]: { openCents: cents, frettedCents: null } },
    }));
  },
  captureFretted: (cents) => {
    const index = get().activeString;
    const existing = index === null ? undefined : get().measurements[index];
    // Bez odczytu pustej struny nie ma do czego odnieść 12. progu.
    if (index === null || !existing) {
      return;
    }
    set((state) => ({
      measurements: { ...state.measurements, [index]: { ...existing, frettedCents: cents } },
    }));
  },
  resetString: (index) =>
    set((state) => {
      const measurements = { ...state.measurements };
      delete measurements[index];
      return { measurements };
    }),
  resetAll: () => set({ activeString: null, measurements: {} }),
}));
