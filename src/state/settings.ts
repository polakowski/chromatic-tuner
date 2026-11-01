import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Accidental } from '../music/notes';
import { CHROMATIC_ID } from '../music/tunings';

export const MIN_REFERENCE_A = 390;
export const MAX_REFERENCE_A = 500;
export const DEFAULT_REFERENCE_A = 440;
/** Popularne stroje: barokowy/klasyczny, orkiestrowe ponad 440. */
export const REFERENCE_A_PRESETS = [415, 432, 435, 440, 442, 444] as const;

export type Sensitivity = 'low' | 'medium' | 'high';

/** Styl wskaźnika odchyłki: pasek centów albo tarcza strobo. */
export type Indicator = 'bar' | 'strobe';

/** RMS gate per sensitivity level — lower means it reacts to quieter playing. */
export const SENSITIVITY_THRESHOLDS: Record<Sensitivity, number> = {
  low: 0.012,
  medium: 0.004,
  high: 0.0015,
};

interface SettingsState {
  referenceA: number;
  accidental: Accidental;
  sensitivity: Sensitivity;
  indicator: Indicator;
  /** Id of the active tuning, or CHROMATIC_ID for free chromatic mode. */
  tuningId: string;
  /** Index of a string the user pinned, or null to follow the nearest one. */
  lockedString: number | null;
  setReferenceA: (value: number) => void;
  adjustReferenceA: (delta: number) => void;
  resetReferenceA: () => void;
  setAccidental: (value: Accidental) => void;
  setSensitivity: (value: Sensitivity) => void;
  setIndicator: (value: Indicator) => void;
  setTuning: (id: string) => void;
  toggleLockedString: (index: number) => void;
}

/** Clamps to the supported range and quantizes to 0.1 Hz. */
export function normalizeReferenceA(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_REFERENCE_A;
  }
  const clamped = Math.min(MAX_REFERENCE_A, Math.max(MIN_REFERENCE_A, value));
  return Math.round(clamped * 10) / 10;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      referenceA: DEFAULT_REFERENCE_A,
      accidental: 'sharp',
      sensitivity: 'medium',
      indicator: 'bar',
      tuningId: CHROMATIC_ID,
      lockedString: null,
      setReferenceA: (value) => set({ referenceA: normalizeReferenceA(value) }),
      adjustReferenceA: (delta) => set({ referenceA: normalizeReferenceA(get().referenceA + delta) }),
      resetReferenceA: () => set({ referenceA: DEFAULT_REFERENCE_A }),
      setAccidental: (accidental) => set({ accidental }),
      setSensitivity: (sensitivity) => set({ sensitivity }),
      setIndicator: (indicator) => set({ indicator }),
      // Zmiana stroju unieważnia przypięcie — indeks wskazywałby inną strunę.
      setTuning: (tuningId) => set({ tuningId, lockedString: null }),
      toggleLockedString: (index) =>
        set({ lockedString: get().lockedString === index ? null : index }),
    }),
    {
      name: 'chromatic-tuner-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
