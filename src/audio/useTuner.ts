import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState } from 'react-native';

import { PitchAnalyzer } from '../dsp/analyzer';
import { PitchSmoother } from '../dsp/smoothing';
import { describeNote, type NoteName } from '../music/notes';
import { frequencyToPitch } from '../music/pitch';
import { findTuning, resolveTarget } from '../music/tunings';
import { SENSITIVITY_THRESHOLDS, useSettings } from '../state/settings';
import { useMicStream } from './micStream';
import type { MicBuffer } from './micStream.types';

/** Requested capture rate; hardware may deliver something else. */
const REQUESTED_SAMPLE_RATE = 44100;
/** Odczyt tekstowy odświeżamy rzadziej niż analizę — wskaźnik i tak jest animowany. */
const READING_INTERVAL_MS = 90;
const SILENCE_FLOOR_DB = -60;

export type PermissionState = 'pending' | 'granted' | 'denied';

export interface TunerReading {
  frequency: number | null;
  /** Deviation from the nearest note in cents. */
  cents: number;
  note: NoteName | null;
  /** Matched string of the active tuning, or null in chromatic mode. */
  stringIndex: number | null;
  /** 0..1 input level, for the level meter. */
  level: number;
}

const SILENT_READING: TunerReading = {
  frequency: null,
  cents: 0,
  note: null,
  stringIndex: null,
  level: 0,
};

function levelFromRms(rms: number): number {
  if (rms <= 0) {
    return 0;
  }
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db - SILENCE_FLOOR_DB) / -SILENCE_FLOOR_DB));
}

/**
 * Mikrofon -> PCM -> f0 -> nuta.
 *
 * `reading` odświeża się ~11x/s (tekst), a `deviation` jest animowaną wartością
 * aktualizowaną w tempie analizy (~43x/s), żeby pasek centów był płynny
 * bez przerysowywania całego drzewa Reacta.
 */
export function useTuner() {
  const [permission, setPermission] = useState<PermissionState>('pending');
  const [reading, setReading] = useState<TunerReading>(SILENT_READING);
  const [isForeground, setIsForeground] = useState(true);

  const sensitivity = useSettings((state) => state.sensitivity);

  // useState, nie useRef — wartość musi być stabilna i czytana podczas renderu.
  const [deviation] = useState(() => new Animated.Value(0));
  const [hasPitch] = useState(() => new Animated.Value(0));

  const analyzerRef = useRef<PitchAnalyzer | null>(null);
  const smootherRef = useRef(new PitchSmoother());
  const monoScratchRef = useRef(new Float32Array(0));
  const lastReadingAtRef = useRef(0);

  const clearReading = useCallback(() => {
    deviation.setValue(0);
    hasPitch.setValue(0);
    setReading(SILENT_READING);
  }, [deviation, hasPitch]);

  const onBuffer = useCallback(
    ({ data, sampleRate, channels }: MicBuffer) => {
      const frames = Math.floor(data.length / channels);

      let mono = data;
      if (channels > 1) {
        if (monoScratchRef.current.length < frames) {
          monoScratchRef.current = new Float32Array(frames);
        }
        mono = monoScratchRef.current;
        for (let i = 0; i < frames; i++) {
          let sum = 0;
          for (let c = 0; c < channels; c++) {
            sum += data[i * channels + c];
          }
          mono[i] = sum / channels;
        }
      }

      let analyzer = analyzerRef.current;
      if (!analyzer || analyzer.sampleRate !== sampleRate) {
        analyzer = new PitchAnalyzer({
          sampleRate,
          rmsThreshold: SENSITIVITY_THRESHOLDS[useSettings.getState().sensitivity],
        });
        analyzerRef.current = analyzer;
        smootherRef.current.reset();
      }

      const result = analyzer.push(mono, frames);
      if (!result) {
        return;
      }

      const now = Date.now();
      const smoothed = smootherRef.current.update(result.frequency, now);
      const throttleElapsed = now - lastReadingAtRef.current >= READING_INTERVAL_MS;

      if (smoothed === null) {
        deviation.setValue(0);
        hasPitch.setValue(0);
        if (throttleElapsed) {
          lastReadingAtRef.current = now;
          setReading((previous) => (previous.note === null ? previous : SILENT_READING));
        }
        return;
      }

      const { referenceA, accidental, tuningId, lockedString } = useSettings.getState();
      const pitch = frequencyToPitch(smoothed, referenceA);
      const target = resolveTarget(pitch.exactMidi, findTuning(tuningId), lockedString);

      deviation.setValue(target.cents);
      hasPitch.setValue(1);

      if (throttleElapsed) {
        lastReadingAtRef.current = now;
        setReading({
          frequency: smoothed,
          cents: target.cents,
          note: describeNote(target.midi, accidental),
          stringIndex: target.stringIndex,
          level: levelFromRms(result.rms),
        });
      }
    },
    [deviation, hasPitch]
  );

  const mic = useMicStream({ sampleRate: REQUESTED_SAMPLE_RATE, onBuffer });

  const requestPermission = useCallback(async () => {
    try {
      const result = await requestRecordingPermissionsAsync();
      setPermission(result.granted ? 'granted' : 'denied');
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    requestRecordingPermissionsAsync()
      .then((result) => {
        if (!cancelled) {
          setPermission(result.granted ? 'granted' : 'denied');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPermission('denied');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mikrofon puszczamy tylko wtedy, gdy aplikacja jest na wierzchu.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setIsForeground(state === 'active');
    });
    return () => subscription.remove();
  }, []);

  const { start, stop } = mic;
  useEffect(() => {
    if (permission !== 'granted' || !isForeground) {
      return;
    }
    const smoother = smootherRef.current;
    void start();
    return () => {
      stop();
      analyzerRef.current?.reset();
      smoother.reset();
      clearReading();
    };
  }, [permission, isForeground, start, stop, clearReading]);

  useEffect(() => {
    analyzerRef.current?.setRmsThreshold(SENSITIVITY_THRESHOLDS[sensitivity]);
  }, [sensitivity]);

  return useMemo(
    () => ({
      reading,
      deviation,
      hasPitch,
      permission,
      status: mic.status,
      error: mic.error,
      requestPermission,
      start: mic.start,
    }),
    [reading, deviation, hasPitch, permission, mic.status, mic.error, mic.start, requestPermission]
  );
}
