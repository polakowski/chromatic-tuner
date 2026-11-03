import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { detectLanguage, type Language } from '../i18n/language';
import { DEFAULT_BRIDGE_ID } from '../music/intonation';
import type { Accidental } from '../music/notes';
import { CHROMATIC_ID } from '../music/tunings';
import { useIntonation } from './intonation';

export const MIN_REFERENCE_A = 390;
export const MAX_REFERENCE_A = 500;
export const DEFAULT_REFERENCE_A = 440;
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
  /** Bridge hardware, which decides the intonation screw direction. */
  bridgeId: string;
  language: Language;
  setReferenceA: (value: number) => void;
  adjustReferenceA: (delta: number) => void;
  setAccidental: (value: Accidental) => void;
  setSensitivity: (value: Sensitivity) => void;
  setIndicator: (value: Indicator) => void;
  setTuning: (id: string) => void;
  toggleLockedString: (index: number) => void;
  setBridge: (id: string) => void;
  setLanguage: (value: Language) => void;
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
      bridgeId: DEFAULT_BRIDGE_ID,
      // Start od języka systemu; zapisany wybór i tak go nadpisze.
      language: detectLanguage(),
      setReferenceA: (value) => set({ referenceA: normalizeReferenceA(value) }),
      adjustReferenceA: (delta) => set({ referenceA: normalizeReferenceA(get().referenceA + delta) }),
      setAccidental: (accidental) => set({ accidental }),
      setSensitivity: (sensitivity) => set({ sensitivity }),
      setIndicator: (indicator) => set({ indicator }),
      setTuning: (tuningId) => {
        // Zmiana stroju unieważnia przypięcie — indeks wskazywałby inną strunę.
        set({ tuningId, lockedString: null });
        // Pomiary menzury też, bo opisują struny poprzedniego stroju.
        useIntonation.getState().resetAll();
      },
      toggleLockedString: (index) =>
        set({ lockedString: get().lockedString === index ? null : index }),
      setBridge: (bridgeId) => set({ bridgeId }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'chromatic-tuner-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
